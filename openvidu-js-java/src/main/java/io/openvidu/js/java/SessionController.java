package io.openvidu.js.java;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpSession;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.TokenOptions;
import io.openvidu.java.client.OpenViduRole;

@RestController
@RequestMapping("/api-sessions")
public class SessionController {

	OpenVidu openVidu;

	private Map<String, Session> mapSessions = new ConcurrentHashMap<>();
	private Map<String, Map<String, OpenViduRole>> mapSessionIdsTokens = new ConcurrentHashMap<>();

	private String OPENVIDU_URL;
	private String SECRET;

	public SessionController(@Value("${openvidu.secret}") String secret, @Value("${openvidu.url}") String openviduUrl) {
		this.SECRET = secret;
		this.OPENVIDU_URL = openviduUrl;
		this.openVidu = new OpenVidu(OPENVIDU_URL, SECRET);
	}

	@RequestMapping(value = "/get-sessionid-token", method = RequestMethod.POST)
	public ResponseEntity<JSONObject> getSessionIdToken(@RequestBody String sessionNameParam, HttpSession httpSession)
			throws ParseException {

		try {
			checkUserLogged(httpSession);
		} catch (Exception e) {
			return getErrorResponse(e);
		}
		System.out.println("Getting sessionId and token | {sessionName}=" + sessionNameParam);

		JSONObject sessionJSON = (JSONObject) new JSONParser().parse(sessionNameParam);
		String sessionName = (String) sessionJSON.get("session");
		OpenViduRole role = LoginController.users.get(httpSession.getAttribute("loggedUser")).role;
		String serverData = "{\"serverData\": \"" + httpSession.getAttribute("loggedUser") + "\"}";

		JSONObject responseJson = new JSONObject();

		if (this.mapSessions.get(sessionName) != null) {
			// Session already exists: return existing sessionId and a new token
			System.out.println("Existing session " + sessionName);
			try {
				String sessionId = this.mapSessions.get(sessionName).getSessionId();
				String token = this.mapSessions.get(sessionName)
						.generateToken(new TokenOptions.Builder().data(serverData).role(role).build());

				this.mapSessionIdsTokens.get(sessionId).put(token, OpenViduRole.PUBLISHER);

				responseJson.put(0, sessionId);
				responseJson.put(1, token);

				return new ResponseEntity<>(responseJson, HttpStatus.OK);
			} catch (Exception e) {
				return getErrorResponse(e);
			}

		} else {
			// New session: return a new sessionId and token
			System.out.println("New session " + sessionName);
			try {
				Session session = this.openVidu.createSession();
				String sessionId = session.getSessionId();
				String token = session.generateToken(new TokenOptions.Builder().data(serverData).role(role).build());

				this.mapSessions.put(sessionName, session);
				this.mapSessionIdsTokens.put(sessionId, new ConcurrentHashMap<>());
				this.mapSessionIdsTokens.get(sessionId).put(token, OpenViduRole.PUBLISHER);

				responseJson.put(0, sessionId);
				responseJson.put(1, token);

				return new ResponseEntity<>(responseJson, HttpStatus.OK);
			} catch (Exception e) {
				return getErrorResponse(e);
			}
		}
	}

	@RequestMapping(value = "/remove-user", method = RequestMethod.POST)
	public ResponseEntity<JSONObject> removeUser(@RequestBody String sessionNameToken, HttpSession httpSession)
			throws Exception {

		try {
			checkUserLogged(httpSession);
		} catch (Exception e) {
			return getErrorResponse(e);
		}
		System.out.println("Removing user | {sessionName, token}=" + sessionNameToken);

		JSONObject sessionNameTokenJSON = (JSONObject) new JSONParser().parse(sessionNameToken);
		String sessionName = (String) sessionNameTokenJSON.get("sessionName");
		String token = (String) sessionNameTokenJSON.get("token");

		if (this.mapSessions.get(sessionName) != null) {
			String sessionId = this.mapSessions.get(sessionName).getSessionId();

			if (this.mapSessionIdsTokens.containsKey(sessionId)) {
				if (this.mapSessionIdsTokens.get(sessionId).remove(token) != null) {
					// User left the session
					if (this.mapSessionIdsTokens.get(sessionId).isEmpty()) {
						// Last user left the session
						this.mapSessions.remove(sessionName);
					}
					return new ResponseEntity<>(HttpStatus.OK);
				} else {
					System.out.println("Problems in the app server: the TOKEN wasn't valid");
					return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
				}
			} else {
				System.out.println("Problems in the app server: the SESSIONID wasn't valid");
				return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
			}
		} else {
			System.out.println("Problems in the app server: the SESSION does not exist");
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private ResponseEntity<JSONObject> getErrorResponse(Exception e) {
		JSONObject json = new JSONObject();
		json.put("cause", e.getCause());
		json.put("error", e.getMessage());
		json.put("exception", e.getClass());
		return new ResponseEntity<>(json, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	private void checkUserLogged(HttpSession httpSession) throws Exception {
		if (httpSession == null || httpSession.getAttribute("loggedUser") == null) {
			throw new Exception("User not logged");
		}
	}

}
