package io.openvidu.mvc.java;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.TokenOptions;

@Controller
public class SessionController {

	// OpenVidu object to ask openvidu-server for sessionId and token
	private OpenVidu openVidu;

	// Collection to pair session names and OpenVidu Session objects
	private Map<String, Session> mapSessions = new ConcurrentHashMap<>();
	// Collection to pair sessionId's and tokens (the inner Map pairs tokens and role associated)
	private Map<String, Map<String, OpenViduRole>> mapSessionIdsTokens = new ConcurrentHashMap<>();

	// URL where our OpenVidu server is listening
	private String OPENVIDU_URL;
	// Secret shared with our OpenVidu server
	private String SECRET;

	public SessionController(@Value("${openvidu.secret}") String secret, @Value("${openvidu.url}") String openviduUrl) {
		this.SECRET = secret;
		this.OPENVIDU_URL = openviduUrl;
		this.openVidu = new OpenVidu(OPENVIDU_URL, SECRET);
	}

	@RequestMapping(value = "/session", method = RequestMethod.POST)
	public String joinSession(@RequestParam(name = "data") String clientData,
			@RequestParam(name = "session-name") String sessionName, Model model, HttpSession httpSession) {

		try {
			checkUserLogged(httpSession);
		} catch (Exception e) {
			return "index";
		}
		System.out.println("Getting sessionId and token | {sessionName}={" + sessionName + "}");

		// Role associated to this user
		OpenViduRole role = LoginController.users.get(httpSession.getAttribute("loggedUser")).role;
		
		// Optional data to be passed to other users when this user connects to the video-call
		// In this case, a JSON with the value we stored in the HttpSession object on login
		String serverData = "{\"serverData\": \"" + httpSession.getAttribute("loggedUser") + "\"}";

		// Build tokenOptions object with the serverData and the role
		TokenOptions tokenOptions = new TokenOptions.Builder().data(serverData).role(role).build();

		if (this.mapSessions.get(sessionName) != null) {
			// Session already exists: return existing sessionId and a new token
			System.out.println("Existing session " + sessionName);
			try {
			
				// Get the existing sessionId from our collection with 
				// the sessionName param ("TUTORIAL")
				String sessionId = this.mapSessions.get(sessionName).getSessionId();
				// Generate a new token with the recently created tokenOptions
				String token = this.mapSessions.get(sessionName).generateToken(tokenOptions);

				// Update our collection storing the new token
				this.mapSessionIdsTokens.get(sessionId).put(token, role);

				// Add all the needed attributes to the template
				model.addAttribute("sessionId", sessionId);
				model.addAttribute("token", token);
				model.addAttribute("nickName", clientData);
				model.addAttribute("userName", httpSession.getAttribute("loggedUser"));
				model.addAttribute("sessionName", sessionName);

				// Return session.html template
				return "session";
				
			} catch (Exception e) {
				// If error just return dashboard.html template
				model.addAttribute("username", httpSession.getAttribute("loggedUser"));
				return "dashboard";
			}
		} else {
			// New session: return a new sessionId and a new token
			System.out.println("New session " + sessionName);
			try {
			
				// Create a new OpenVidu Session
				Session session = this.openVidu.createSession();
				// Get the sessionId
				String sessionId = session.getSessionId();
				// Generate a new token with the recently created tokenOptions
				String token = session.generateToken(tokenOptions);

				// Store the session and the token in our collections
				this.mapSessions.put(sessionName, session);
				this.mapSessionIdsTokens.put(sessionId, new ConcurrentHashMap<>());
				this.mapSessionIdsTokens.get(sessionId).put(token, role);

				// Add all the needed attributes to the template
				model.addAttribute("sessionId", sessionId);
				model.addAttribute("token", token);
				model.addAttribute("nickName", clientData);
				model.addAttribute("userName", httpSession.getAttribute("loggedUser"));
				model.addAttribute("sessionName", sessionName);

				// Return session.html template
				return "session";
				
			} catch (Exception e) {
				// If error just return dashboard.html template
				model.addAttribute("username", httpSession.getAttribute("loggedUser"));
				return "dashboard";
			}
		}
	}

	@RequestMapping(value = "/leave-session", method = RequestMethod.POST)
	public String removeUser(@RequestParam(name = "session-name") String sessionName,
			@RequestParam(name = "token") String token, Model model, HttpSession httpSession) throws Exception {

		try {
			checkUserLogged(httpSession);
		} catch (Exception e) {
			return "index";
		}
		System.out.println("Removing user | sessioName=" + sessionName + ", token=" + token);

		// If the session exists
		if (this.mapSessions.get(sessionName) != null) {
			String sessionId = this.mapSessions.get(sessionName).getSessionId();

			if (this.mapSessionIdsTokens.containsKey(sessionId)) {
				// If the token exists
				if (this.mapSessionIdsTokens.get(sessionId).remove(token) != null) {
					System.out.println(sessionName + ": " + this.mapSessionIdsTokens.get(sessionId).toString());
					// User left the session
					if (this.mapSessionIdsTokens.get(sessionId).isEmpty()) {
						// Last user left: session must be removed
						this.mapSessions.remove(sessionName);
						System.out.println(sessionName + " empty!");
					}
					return "redirect:/dashboard";
				} else {
					// The TOKEN wasn't valid
					System.out.println("Problems in the app server: the TOKEN wasn't valid");
					return "redirect:/dashboard";
				}
			} else {
				// The SESSIONID wasn't valid
				System.out.println("Problems in the app server: the SESSIONID wasn't valid");
				return "redirect:/dashboard";
			}
		} else {
			// The SESSION does not exist
			System.out.println("Problems in the app server: the SESSION does not exist");
			return "redirect:/dashboard";
		}
	}

	private void checkUserLogged(HttpSession httpSession) throws Exception {
		if (httpSession == null || httpSession.getAttribute("loggedUser") == null) {
			throw new Exception("User not logged");
		}
	}

}
