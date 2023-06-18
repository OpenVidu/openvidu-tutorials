package io.openvidu.fault.tolerance;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.JsonObject;

import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.SessionProperties;

@RestController
@RequestMapping("/api")
public class MyRestController {

	private static final Logger log = LoggerFactory.getLogger(MyRestController.class);

	// URL where our OpenVidu server is listening
	private String OPENVIDU_URL;
	// Secret shared with our OpenVidu server
	private String SECRET;

	// OpenVidu object as entrypoint of the SDK
	private OpenVidu openVidu;

	public MyRestController(@Value("${openvidu.secret}") String secret, @Value("${openvidu.url}") String openviduUrl) {
		this.SECRET = secret;
		this.OPENVIDU_URL = openviduUrl;
		this.openVidu = new OpenVidu(OPENVIDU_URL, SECRET);
		log.info("Connecting to OpenVidu Pro Multi Master cluster at {}", OPENVIDU_URL);
	}

	/**
	 * This method creates a Connection for an existing or new Session, and returns
	 * the Connection's token to the client side. It also handles the petition to
	 * reconnect to a crashed session, as the process is exactly the same
	 */
	@RequestMapping(value = "/get-token", method = RequestMethod.POST)
	public ResponseEntity<?> getToken(@RequestBody Map<String, Object> params) {

		log.info("Getting token | {sessionId}={}", params);

		// The Session to connect
		String sessionId = (String) params.get("sessionId");

		SessionProperties props = new SessionProperties.Builder().customSessionId(sessionId).build();
		Session session = null;
		try {
			session = this.openVidu.createSession(props);
		} catch (OpenViduHttpException e) {
			if ((e.getStatus() >= 500 && e.getStatus() <= 504) || e.getStatus() == 404) {
				log.warn("The node handling the createSession operation is crashed ({}: {}). Retry", e.getStatus(),
						e.getMessage());
				try {
					Thread.sleep(100);
				} catch (InterruptedException e1) {
				}
				return getToken(params);
			} else {
				log.error("Unexpected error while creating session: {}", e.getMessage());
				return getErrorResponse(e);
			}
		} catch (OpenViduJavaClientException e) {
			log.error("Unexpected internal error while creating session. {}: {}", e.getClass().getCanonicalName(),
					e.getMessage());
			return getErrorResponse(e);
		}
		return returnToken(session);
	}

	private ResponseEntity<?> returnToken(Session session) {
		try {
			String token = session.createConnection().getToken();

			// Send the response with the token
			JsonObject responseJson = new JsonObject();
			responseJson.addProperty("token", token);
			return new ResponseEntity<>(responseJson, HttpStatus.OK);

		} catch (OpenViduJavaClientException e1) {
			// If internal error generate an error message and return it to client
			log.error("Unexpected internal error while creating connection: {}", e1.getMessage());
			return getErrorResponse(e1);
		} catch (OpenViduHttpException e2) {
			if (404 == e2.getStatus()) {
				// The session wasn't found in OpenVidu Server
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
			if (e2.getStatus() >= 500 && e2.getStatus() <= 504) {
				log.warn("The node handling the createConnection operation is crashed ({}: {}). Retry", e2.getStatus(),
						e2.getMessage());
				try {
					Thread.sleep(100);
				} catch (InterruptedException e1) {
				}
				return returnToken(session);
			}
			return getErrorResponse(e2);
		}
	}

	private ResponseEntity<JsonObject> getErrorResponse(Exception e) {
		JsonObject json = new JsonObject();
		if (e.getCause() != null) {
			json.addProperty("cause", e.getCause().toString());
		}
		if (e.getStackTrace() != null) {
			json.addProperty("stacktrace", e.getStackTrace().toString());
		}
		json.addProperty("error", e.getMessage());
		json.addProperty("exception", e.getClass().getCanonicalName());
		return new ResponseEntity<>(json, HttpStatus.INTERNAL_SERVER_ERROR);
	}

}
