package io.openvidu.recording.java;

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

import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.Recording;
import io.openvidu.java.client.RecordingProperties;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.ConnectionProperties;

@RestController
@RequestMapping("/api")
public class MyRestController {

	// OpenVidu object as entrypoint of the SDK
	private OpenVidu openVidu;

	// Collection to pair session names and OpenVidu Session objects
	private Map<String, Session> mapSessions = new ConcurrentHashMap<>();
	// Collection to pair session names and tokens (the inner Map pairs tokens and
	// role associated)
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

		// Build connectionProperties object with the serverData and the role
		ConnectionProperties connectionProperties = new ConnectionProperties.Builder()
			.type(ConnectionType.WEBRTC)
			.role(role)
			.data("user_data")
			.build();

		JSONObject responseJson = new JSONObject();

		if (this.mapSessions.get(sessionName) != null) {
			// Session already exists
			System.out.println("Existing session " + sessionName);
			try {

				// Generate a new token with the recently created connectionProperties
				String token = this.mapSessions.get(sessionName).createConnection(connectionProperties).getToken();

				// Update our collection storing the new token
				this.mapSessionNamesTokens.get(sessionName).put(token, role);

				// Prepare the response with the token
				responseJson.put(0, token);

				// Return the response to the client
				return new ResponseEntity<>(responseJson, HttpStatus.OK);

			} catch (OpenViduJavaClientException e1) {
				// If internal error generate an error message and return it to client
				return getErrorResponse(e1);
			} catch (OpenViduHttpException e2) {
				if (404 == e2.getStatus()) {
					// Invalid sessionId (user left unexpectedly). Session object is not valid
					// anymore. Clean collections and continue as new session
					this.mapSessions.remove(sessionName);
					this.mapSessionNamesTokens.remove(sessionName);
				}
			}
		}

		// New session
		System.out.println("New session " + sessionName);
		try {

			// Create a new OpenVidu Session
			Session session = this.openVidu.createSession();// new
															// SessionProperties.Builder().customSessionId("CUSTOMSESSIONID").defaultRecordingLayout(RecordingLayout.CUSTOM).defaultCustomLayout("CUSTOM/LAYOUT").recordingMode(RecordingMode.ALWAYS).build());
			// Generate a new token with the recently created connectionProperties
			String token = session.createConnection(connectionProperties).getToken();

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

	@RequestMapping(value = "/close-session", method = RequestMethod.DELETE)
	public ResponseEntity<JSONObject> closeSession(@RequestBody String sessionName) throws Exception {

		System.out.println("Closing session | {sessionName}=" + sessionName);

		// Retrieve the param from BODY
		JSONObject sessionNameJSON = (JSONObject) new JSONParser().parse(sessionName);
		String session = (String) sessionNameJSON.get("sessionName");

		// If the session exists
		if (this.mapSessions.get(session) != null && this.mapSessionNamesTokens.get(session) != null) {
			Session s = this.mapSessions.get(session);
			s.close();
			this.mapSessions.remove(session);
			this.mapSessionNamesTokens.remove(session);
			this.sessionRecordings.remove(s.getSessionId());
			return new ResponseEntity<>(HttpStatus.OK);
		} else {
			// The SESSION does not exist
			System.out.println("Problems in the app server: the SESSION does not exist");
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@RequestMapping(value = "/fetch-info", method = RequestMethod.POST)
	public ResponseEntity<JSONObject> fetchInfo(@RequestBody String sessionName) {
		try {
			System.out.println("Fetching session info | {sessionName}=" + sessionName);

			// Retrieve the param from BODY
			JSONObject sessionNameJSON = (JSONObject) new JSONParser().parse(sessionName);
			String session = (String) sessionNameJSON.get("sessionName");

			// If the session exists
			if (this.mapSessions.get(session) != null && this.mapSessionNamesTokens.get(session) != null) {
				Session s = this.mapSessions.get(session);
				boolean changed = s.fetch();
				System.out.println("Any change: " + changed);
				return new ResponseEntity<>(this.sessionToJson(s), HttpStatus.OK);
			} else {
				// The SESSION does not exist
				System.out.println("Problems in the app server: the SESSION does not exist");
				return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
			}
		} catch (ParseException | OpenViduJavaClientException | OpenViduHttpException e) {
			e.printStackTrace();
			return getErrorResponse(e);
		}
	}

	@RequestMapping(value = "/fetch-all", method = RequestMethod.GET)
	public ResponseEntity<?> fetchAll() {
		try {
			System.out.println("Fetching all session info");
			boolean changed = this.openVidu.fetch();
			System.out.println("Any change: " + changed);
			JSONArray jsonArray = new JSONArray();
			for (Session s : this.openVidu.getActiveSessions()) {
				jsonArray.add(this.sessionToJson(s));
			}
			return new ResponseEntity<>(jsonArray, HttpStatus.OK);
		} catch (OpenViduJavaClientException | OpenViduHttpException e) {
			e.printStackTrace();
			return getErrorResponse(e);
		}
	}

	@RequestMapping(value = "/force-disconnect", method = RequestMethod.DELETE)
	public ResponseEntity<JSONObject> forceDisconnect(@RequestBody String sessionName) {
		try {
			// Retrieve the param from BODY
			JSONObject sessionNameConnectionIdJSON = (JSONObject) new JSONParser().parse(sessionName);
			String session = (String) sessionNameConnectionIdJSON.get("sessionName");
			String connectionId = (String) sessionNameConnectionIdJSON.get("connectionId");

			// If the session exists
			if (this.mapSessions.get(session) != null && this.mapSessionNamesTokens.get(session) != null) {
				Session s = this.mapSessions.get(session);
				s.forceDisconnect(connectionId);
				return new ResponseEntity<>(HttpStatus.OK);
			} else {
				// The SESSION does not exist
				return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
			}
		} catch (ParseException | OpenViduJavaClientException | OpenViduHttpException e) {
			e.printStackTrace();
			return getErrorResponse(e);
		}
	}

	@RequestMapping(value = "/force-unpublish", method = RequestMethod.DELETE)
	public ResponseEntity<JSONObject> forceUnpublish(@RequestBody String sessionName) {
		try {
			// Retrieve the param from BODY
			JSONObject sessionNameStreamIdJSON = (JSONObject) new JSONParser().parse(sessionName);
			String session = (String) sessionNameStreamIdJSON.get("sessionName");
			String streamId = (String) sessionNameStreamIdJSON.get("streamId");

			// If the session exists
			if (this.mapSessions.get(session) != null && this.mapSessionNamesTokens.get(session) != null) {
				Session s = this.mapSessions.get(session);
				s.forceUnpublish(streamId);
				return new ResponseEntity<>(HttpStatus.OK);
			} else {
				// The SESSION does not exist
				return new ResponseEntity<>(HttpStatus.NOT_FOUND);
			}
		} catch (ParseException | OpenViduJavaClientException | OpenViduHttpException e) {
			e.printStackTrace();
			return getErrorResponse(e);
		}
	}

	/*******************/
	/** Recording API **/
	/*******************/

	@RequestMapping(value = "/recording/start", method = RequestMethod.POST)
	public ResponseEntity<?> startRecording(@RequestBody String param) throws ParseException {
		JSONObject json = (JSONObject) new JSONParser().parse(param);

		String sessionId = (String) json.get("session");
		Recording.OutputMode outputMode = Recording.OutputMode.valueOf((String) json.get("outputMode"));
		boolean hasAudio = (boolean) json.get("hasAudio");
		boolean hasVideo = (boolean) json.get("hasVideo");

		RecordingProperties properties = new RecordingProperties.Builder().outputMode(outputMode).hasAudio(hasAudio)
				.hasVideo(hasVideo).build();

		System.out.println("Starting recording for session " + sessionId + " with properties {outputMode=" + outputMode
				+ ", hasAudio=" + hasAudio + ", hasVideo=" + hasVideo + "}");

		try {
			Recording recording = this.openVidu.startRecording(sessionId, properties);
			this.sessionRecordings.put(sessionId, true);
			return new ResponseEntity<>(recording, HttpStatus.OK);
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
			return new ResponseEntity<>(recording, HttpStatus.OK);
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
			return new ResponseEntity<>(recording, HttpStatus.OK);
		} catch (OpenViduJavaClientException | OpenViduHttpException e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}

	@RequestMapping(value = "/recording/list", method = RequestMethod.GET)
	public ResponseEntity<?> listRecordings() {

		System.out.println("Listing recordings");

		try {
			List<Recording> recordings = this.openVidu.listRecordings();

			return new ResponseEntity<>(recordings, HttpStatus.OK);
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
	protected JSONObject sessionToJson(Session session) {
		JSONObject json = new JSONObject();
		json.put("sessionId", session.getSessionId());
		json.put("customSessionId", session.getProperties().customSessionId());
		json.put("recording", session.isBeingRecorded());
		json.put("mediaMode", session.getProperties().mediaMode());
		json.put("recordingMode", session.getProperties().recordingMode());
		json.put("defaultRecordingLayout", session.getProperties().defaultRecordingLayout());
		json.put("defaultCustomLayout", session.getProperties().defaultCustomLayout());
		JSONObject connections = new JSONObject();
		connections.put("numberOfElements", session.getConnections().size());
		JSONArray jsonArrayConnections = new JSONArray();
		session.getConnections().forEach(con -> {
			JSONObject c = new JSONObject();
			c.put("connectionId", con.getConnectionId());
			c.put("role", con.getRole());
			c.put("token", con.getToken());
			c.put("clientData", con.getClientData());
			c.put("serverData", con.getServerData());
			JSONArray pubs = new JSONArray();
			con.getPublishers().forEach(p -> {
				JSONObject jsonP = new JSONObject();
				jsonP.put("streamId", p.getStreamId());
				jsonP.put("hasAudio", p.hasAudio());
				jsonP.put("hasVideo", p.hasVideo());
				jsonP.put("audioActive", p.isAudioActive());
				jsonP.put("videoActive", p.isVideoActive());
				jsonP.put("frameRate", p.getFrameRate());
				jsonP.put("typeOfVideo", p.getTypeOfVideo());
				jsonP.put("videoDimensions", p.getVideoDimensions());
				pubs.add(jsonP);
			});
			JSONArray subs = new JSONArray();
			con.getSubscribers().forEach(s -> {
				subs.add(s);
			});
			c.put("publishers", pubs);
			c.put("subscribers", subs);
			jsonArrayConnections.add(c);
		});
		connections.put("content", jsonArrayConnections);
		json.put("connections", connections);
		return json;
	}

}
