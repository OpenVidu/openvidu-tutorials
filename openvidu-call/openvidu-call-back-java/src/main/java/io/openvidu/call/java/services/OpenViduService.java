package io.openvidu.call.java.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

import io.openvidu.call.java.models.RecordingData;
import io.openvidu.java.client.Connection;
import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Recording;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.SessionProperties;

@Service
public class OpenViduService {

	public static final String RECORDING_TOKEN_NAME = "ovCallRecordingToken";
	public static final String ADMIN_TOKEN_NAME = "ovCallAdminToken";
	public Map<String, RecordingData> recordingMap = new HashMap<String, RecordingData>();
	public List<String> adminTokens = new ArrayList<String>();

	@Value("${OPENVIDU_URL}")
	public String OPENVIDU_URL;

	@Value("${OPENVIDU_SECRET}")
	private String OPENVIDU_SECRET;

	private OpenVidu openvidu;

	@PostConstruct
	public void init() {
		this.openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
	}

	public String getBasicAuth() {
		String stringToEncode = "OPENVIDUAPP:" + OPENVIDU_SECRET;
		byte[] encodedString = Base64.encodeBase64(stringToEncode.getBytes());
		return "Basic " + new String(encodedString);
	}

	public long getDateFromCookie(String recordingToken) {
		try {
			if (!recordingToken.isEmpty()) {
				MultiValueMap<String, String> cookieTokenParams = UriComponentsBuilder.fromUriString(recordingToken).build()
						.getQueryParams();
				String date = cookieTokenParams.get("createdAt").get(0);
				return Long.parseLong(date);
			} else {
				return System.currentTimeMillis();
			}
		} catch(Exception e) {
			return System.currentTimeMillis();
		}
	}

	public String getSessionIdFromCookie(String cookie) {
		try {

			if (!cookie.isEmpty()) {
				MultiValueMap<String, String> cookieTokenParams = UriComponentsBuilder.fromUriString(cookie)
						.build().getQueryParams();
				return cookieTokenParams.get("sessionId").get(0);
			}

		} catch (Exception error) {
			System.out.println("Recording cookie not found");
			System.err.println(error);
		}
		return "";

	}

	public boolean isValidToken(String sessionId, String recordingToken) {
		try {

			if (!recordingToken.isEmpty()) {
				MultiValueMap<String, String> storedTokenParams = null;
				
				if(this.recordingMap.containsKey(sessionId)) {
					storedTokenParams = UriComponentsBuilder
							.fromUriString(this.recordingMap.get(sessionId).getToken()).build().getQueryParams();
				}

				MultiValueMap<String, String> cookieTokenParams = UriComponentsBuilder
						.fromUriString(recordingToken).build().getQueryParams();

				if (!cookieTokenParams.isEmpty() && storedTokenParams != null) {
					String cookieSessionId = cookieTokenParams.get("sessionId").get(0);
					String cookieToken = cookieTokenParams.get(RECORDING_TOKEN_NAME).get(0);
					String cookieDate = cookieTokenParams.get("createdAt").get(0);

					String storedToken = storedTokenParams.get(RECORDING_TOKEN_NAME).get(0);
					String storedDate = storedTokenParams.get("createdAt").get(0);

					return sessionId.equals(cookieSessionId) && cookieToken.equals(storedToken) && cookieDate.equals(storedDate);
				}
			}

			return false;
		} catch (Exception e) {
			return false;
		}
	}

	public Session createSession(String sessionId) throws OpenViduJavaClientException, OpenViduHttpException {
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("customSessionId", sessionId);
		SessionProperties properties = SessionProperties.fromJson(params).build();
		Session session = openvidu.createSession(properties);
		session.fetch();
		return session;
	}

	public Connection createConnection(Session session, String nickname, OpenViduRole role)
			throws OpenViduJavaClientException, OpenViduHttpException {
		Map<String, Object> params = new HashMap<String, Object>();
		Map<String, Object> connectionData = new HashMap<String, Object>();

		if (!nickname.isEmpty()) {
			connectionData.put("openviduCustomConnectionId", nickname);
		}
		params.put("role", role.name());
		params.put("data", connectionData.toString());
		ConnectionProperties properties = ConnectionProperties.fromJson(params).build();
		return session.createConnection(properties);

	}

	public Recording startRecording(String sessionId) throws OpenViduJavaClientException, OpenViduHttpException {
		return this.openvidu.startRecording(sessionId);
	}

	public Recording stopRecording(String recordingId) throws OpenViduJavaClientException, OpenViduHttpException {
		return this.openvidu.stopRecording(recordingId);
	}

	public void deleteRecording(String recordingId) throws OpenViduJavaClientException, OpenViduHttpException {
		this.openvidu.deleteRecording(recordingId);
	}

	public Recording getRecording(String recordingId) throws OpenViduJavaClientException, OpenViduHttpException {
		return this.openvidu.getRecording(recordingId);
	}

	public List<Recording> listAllRecordings() throws OpenViduJavaClientException, OpenViduHttpException {
		return this.openvidu.listRecordings();
	}

	public List<Recording> listRecordingsBySessionIdAndDate(String sessionId, long date)
			throws OpenViduJavaClientException, OpenViduHttpException {
		List<Recording> recordings = this.listAllRecordings();
		List<Recording> recordingsAux = new ArrayList<Recording>();
		for (Recording recording : recordings) {
			if (recording.getSessionId().equals(sessionId) && date <= recording.getCreatedAt()) {
				recordingsAux.add(recording);
			}
		}
		return recordingsAux;
	}

}
