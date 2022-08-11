package io.openvidu.call.java.services;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Enumeration;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class ProxyService {

	@Value("${OPENVIDU_URL}")
	public String OPENVIDU_URL;
	
	@Autowired
	private OpenViduService openviduService;

	public ResponseEntity<?> processProxyRequest(HttpServletRequest request, HttpServletResponse response)
			throws URISyntaxException {

		String requestUrl = request.getRequestURI();

		URI uri = UriComponentsBuilder.fromUriString(OPENVIDU_URL).path(requestUrl).query(request.getQueryString()).build(true).toUri();
		
		HttpHeaders headers = new HttpHeaders();
		Enumeration<String> headerNames = request.getHeaderNames();

		while (headerNames.hasMoreElements()) {
			String headerName = headerNames.nextElement();
			headers.set(headerName, request.getHeader(headerName));
		}
		
		headers.add("Authorization", this.openviduService.getBasicAuth());

		headers.remove(HttpHeaders.ACCEPT_ENCODING);

		HttpEntity<String> httpEntity = new HttpEntity<>(null, headers);
		ClientHttpRequestFactory factory = new BufferingClientHttpRequestFactory(new SimpleClientHttpRequestFactory());
		RestTemplate restTemplate = new RestTemplate(factory);
		try {

			return restTemplate.exchange(uri, HttpMethod.GET, httpEntity,  byte[].class);

		} catch (HttpStatusCodeException e) {
			System.err.println(e.getMessage());
			System.err.println(e.getRawStatusCode());
			return ResponseEntity.status(e.getRawStatusCode()).headers(e.getResponseHeaders())
					.body(e.getResponseBodyAsString());
		}

	}
}
