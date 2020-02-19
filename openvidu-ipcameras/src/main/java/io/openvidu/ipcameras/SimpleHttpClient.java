package io.openvidu.ipcameras;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.SSLContext;

import org.apache.http.HttpHeaders;
import org.apache.http.HttpResponse;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.http.ssl.TrustStrategy;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.JsonObject;

/**
 * Simple HTTP client able to send REST API requests to insecure servers
 * (self-signed certificates are accepted). It only implements a single method
 * to publish an IP camera to an OpenVidu Server session. This is only necessary
 * because openvidu-java-client SDK does not implement the publish method for IP
 * cameras yet
 * 
 * @author Pablo Fuente (pablofuenteperez@gmail.com)
 */
public class SimpleHttpClient {

	private static final Logger log = LoggerFactory.getLogger(App.class);

	private CloseableHttpClient httpClient;

	public SimpleHttpClient() {

		TrustStrategy trustStrategy = new TrustStrategy() {
			@Override
			public boolean isTrusted(X509Certificate[] chain, String authType) throws CertificateException {
				return true;
			}
		};

		SSLContext sslContext;
		try {
			sslContext = new SSLContextBuilder().loadTrustMaterial(null, trustStrategy).build();
		} catch (KeyManagementException | NoSuchAlgorithmException | KeyStoreException e) {
			throw new RuntimeException(e);
		}

		RequestConfig.Builder requestBuilder = RequestConfig.custom();
		requestBuilder = requestBuilder.setConnectTimeout(30000);
		requestBuilder = requestBuilder.setConnectionRequestTimeout(30000);

		httpClient = HttpClientBuilder.create().setDefaultRequestConfig(requestBuilder.build())
				.setConnectionTimeToLive(30, TimeUnit.SECONDS).setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
				.setSSLContext(sslContext).build();
	}

	public void publishIpCamera(String sessionId, String rtspUri, String cameraName, boolean adaptativeBitrate,
			boolean onlyPlayWhenSubscribers) throws Exception {

		HttpPost request = new HttpPost(App.OPENVIDU_URL + "api/sessions/" + sessionId + "/connection");

		JsonObject json = new JsonObject();
		json.addProperty("rtspUri", rtspUri);
		json.addProperty("data", cameraName);
		json.addProperty("adaptativeBitrate", adaptativeBitrate);
		json.addProperty("onlyPlayWithSubscribers", onlyPlayWhenSubscribers);
		StringEntity params = new StringEntity(json.toString());

		request.setHeader(HttpHeaders.CONTENT_TYPE, "application/json");
		request.setHeader(HttpHeaders.AUTHORIZATION,
				"Basic " + Base64.getEncoder().encodeToString(("OPENVIDUAPP:" + App.OPENVIDU_SECRET).getBytes()));
		request.setEntity(params);

		HttpResponse response;
		try {
			response = this.httpClient.execute(request);
		} catch (IOException e) {
			log.error("Error publishing IP camera {}: {}", rtspUri, e.getMessage());
			throw new Exception(e.getMessage(), e.getCause());
		}
		try {
			int statusCode = response.getStatusLine().getStatusCode();
			if ((statusCode == org.apache.http.HttpStatus.SC_OK)) {
				log.info("IP camera '{}' published", rtspUri);
			} else {
				log.error("Error publishing IP camera {}: Http status {}", rtspUri, statusCode);
				throw new Exception(Integer.toString(statusCode));
			}
		} finally {
			EntityUtils.consumeQuietly(response.getEntity());
		}
	}

}
