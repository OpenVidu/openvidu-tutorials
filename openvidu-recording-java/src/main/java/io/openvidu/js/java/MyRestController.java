package io.openvidu.js.java;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import io.openvidu.java.client.Recording;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.TokenOptions;
import io.openvidu.java.client.OpenViduRole;

@RestController
@RequestMapping("/api")
public class MyRestController {

	// OpenVidu object as entrypoint of the SDK
	private OpenVidu openVidu;

	// Collection to pair session names and OpenVidu Session objects
	private Map<String, Session> mapSessions = new ConcurrentHashMap<>();
	// Collection to pair session names and tokens (the inner Map pairs tokens and role associated)
	private Map<String, Map<String, OpenViduRole>> mapSessionNamesTokens = new ConcurrentHashMap<>();
	// Collection to pair session names and recording objects
	private Map<String, Boolean> sessionRecordings = new ConcurrentHashMap<>();

	// URL where our OpenVidu server is listening
	private String OPENVIDU_URL;
	// Secret shared with our OpenVidu server
	private String SECRET;

	public MyRestController(@Value("${openvidu.secret}") String secret, @Value("${openvidu.url}") String openviduUrl) {
		this.SECRET = secret;
		this.OPENVIDU_URL = openviduUrl;
		this.openVidu = new OpenVidu(OPENVIDU_URL, SECRET);
	}

	/*******************/
	/*** Session API ***/
	/*******************/

	@RequestMapping(value = "/get-token", method = RequestMethod.POST)
	public ResponseEntity<JSONObject> getToken(@RequestBody String sessionNameParam) throws ParseException {

		System.out.println("Getting sessionId and token | {sessionName}=" + sessionNameParam);

		JSONObject sessionJSON = (JSONObject) new JSONParser().parse(sessionNameParam);

		// The video-call to connect ("TUTORIAL")
		String sessionName = (String) sessionJSON.get("sessionName");

		// Role associated to this user
		OpenViduRole role = OpenViduRole.PUBLISHER;

		// Build tokenOptions object with the serverData and the role
		TokenOptions tokenOptions = new TokenOptions.Builder().role(role).build();

		JSONObject responseJson = new JSONObject();

		if (this.mapSessions.get(sessionName) != null) {
			// Session already exists
			System.out.println("Existing session " + sessionName);
			try {

				// Generate a new token with the recently created tokenOptions
				String token = this.mapSessions.get(sessionName).generateToken(tokenOptions);

				// Update our collection storing the new token
				this.mapSessionNamesTokens.get(sessionName).put(token, role);

				// Prepare the response with the token
				responseJson.put(0, token);

				// Return the response to the client
				return new ResponseEntity<>(responseJson, HttpStatus.OK);

			} catch (Exception e) {
				// If error generate an error message and return it to client
				return getErrorResponse(e);
			}

		} else {
			// New session
			System.out.println("New session " + sessionName);
			try {

				// Create a new OpenVidu Session
				Session session = this.openVidu.createSession();
				// Generate a new token with the recently created tokenOptions
				String token = session.generateToken(tokenOptions);

				// Store the session and the token in our collections
				this.mapSessions.put(sessionName, session);
				this.mapSessionNamesTokens.put(sessionName, new ConcurrentHashMap<>());
				this.mapSessionNamesTokens.get(sessionName).put(token, role);

				// Prepare the response with the sessionId and the token
				responseJson.put(0, token);

				// Return the response to the client
				return new ResponseEntity<>(responseJson, HttpStatus.OK);

			} catch (Exception e) {
				// If error generate an error message and return it to client
				return getErrorResponse(e);
			}
		}
	}

	@RequestMapping(value = "/remove-user", method = RequestMethod.POST)
	public ResponseEntity<JSONObject> removeUser(@RequestBody String sessionNameToken) throws Exception {

		System.out.println("Removing user | {sessionName, token}=" + sessionNameToken);

		// Retrieve the params from BODY
		JSONObject sessionNameTokenJSON = (JSONObject) new JSONParser().parse(sessionNameToken);
		String sessionName = (String) sessionNameTokenJSON.get("sessionName");
		String token = (String) sessionNameTokenJSON.get("token");

		// If the session exists
		if (this.mapSessions.get(sessionName) != null && this.mapSessionNamesTokens.get(sessionName) != null) {

			// If the token exists
			if (this.mapSessionNamesTokens.get(sessionName).remove(token) != null) {
				// User left the session
				if (this.mapSessionNamesTokens.get(sessionName).isEmpty()) {
					// Last user left: session must be removed
					this.mapSessions.remove(sessionName);
				}
				return new ResponseEntity<>(HttpStatus.OK);
			} else {
				// The TOKEN wasn't valid
				System.out.println("Problems in the app server: the TOKEN wasn't valid");
				return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
			}

		} else {
			// The SESSION does not exist
			System.out.println("Problems in the app server: the SESSION does not exist");
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/*******************/
	/** Recording API **/
	/*******************/

	@RequestMapping(value = "/recording/start", method = RequestMethod.POST)
	public ResponseEntity<?> startRecording(@RequestBody String param) throws ParseException {
		JSONObject json = (JSONObject) new JSONParser().parse(param);
		String sessionId = (String) json.get("session");

		System.out.println("Starting recording | {sessionId}=" + sessionId);

		try {
			Recording recording = this.openVidu.startRecording(sessionId);
			this.sessionRecordings.put(sessionId, true);
			return new ResponseEntity<>(getJsonFromRecording(recording), HttpStatus.OK);
		} catch (OpenViduJavaClientException | OpenViduHttpException e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}

	@RequestMapping(value = "/recording/stop", method = RequestMethod.POST)
	public ResponseEntity<?> stopRecording(@RequestBody String param) throws ParseException {
		JSONObject json = (JSONObject) new JSONParser().parse(param);
		String recordingId = (String) json.get("recording");

		System.out.println("Stoping recording | {recordingId}=" + recordingId);

		try {
			Recording recording = this.openVidu.stopRecording(recordingId);
			this.sessionRecordings.remove(recording.getSessionId());
			return new ResponseEntity<>(getJsonFromRecording(recording), HttpStatus.OK);
		} catch (OpenViduJavaClientException | OpenViduHttpException e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}

	@RequestMapping(value = "/recording/delete", method = RequestMethod.DELETE)
	public ResponseEntity<?> deleteRecording(@RequestBody String param) throws ParseException {
		JSONObject json = (JSONObject) new JSONParser().parse(param);
		String recordingId = (String) json.get("recording");

		System.out.println("Deleting recording | {recordingId}=" + recordingId);

		try {
			this.openVidu.deleteRecording(recordingId);
			return new ResponseEntity<>(HttpStatus.OK);
		} catch (OpenViduJavaClientException | OpenViduHttpException e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}

	@RequestMapping(value = "/recording/get/{recordingId}", method = RequestMethod.GET)
	public ResponseEntity<?> getRecording(@PathVariable(value = "recordingId") String recordingId) {

		System.out.println("Getting recording | {recordingId}=" + recordingId);

		try {
			Recording recording = this.openVidu.getRecording(recordingId);
			return new ResponseEntity<>(getJsonFromRecording(recording), HttpStatus.OK);
		} catch (OpenViduJavaClientException | OpenViduHttpException e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}

	@RequestMapping(value = "/recording/list", method = RequestMethod.GET)
	public ResponseEntity<?> listRecordings() {

		System.out.println("Listing recordings");

		try {
			List<Recording> recordings = this.openVidu.listRecordings();

			return new ResponseEntity<>(getJsonArrayFromRecordingList(recordings), HttpStatus.OK);
		} catch (OpenViduJavaClientException | OpenViduHttpException e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}

	@SuppressWarnings("unchecked")
	private ResponseEntity<JSONObject> getErrorResponse(Exception e) {
		JSONObject json = new JSONObject();
		json.put("cause", e.getCause());
		json.put("error", e.getMessage());
		json.put("exception", e.getClass());
		return new ResponseEntity<>(json, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	@SuppressWarnings("unchecked")
	private JSONObject getJsonFromRecording(Recording recording) {
		JSONObject json = new JSONObject();
		json.put("createdAt", recording.getCreatedAt());
		json.put("duration", recording.getDuration());
		json.put("hasAudio", recording.hasAudio());
		json.put("hasVideo", recording.hasVideo());
		json.put("id", recording.getId());
		json.put("recordingLayout", recording.getRecordingLayout());
		json.put("name", recording.getName());
		json.put("sessionId", recording.getSessionId());
		json.put("size", recording.getSize());
		json.put("status", recording.getStatus());
		json.put("url", recording.getUrl());
		return json;
	}

	@SuppressWarnings("unchecked")
	private JSONArray getJsonArrayFromRecordingList(Collection<Recording> recordings) {
		JSONArray array = new JSONArray();
		for (Recording recording : recordings) {
			array.add(getJsonFromRecording(recording));
		}
		return array;
	}

}
