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

	@RequestMapping(value = "/session", method = RequestMethod.POST)
	public String joinSession(@RequestParam(name = "data") String clientData,
			@RequestParam(name = "session-name") String sessionName, Model model, HttpSession httpSession) {

		try {
			checkUserLogged(httpSession);
		} catch (Exception e) {
			return "index";
		}
		System.out.println("Getting sessionId and token | {sessionName}={" + sessionName + "}");

		OpenViduRole role = LoginController.users.get(httpSession.getAttribute("loggedUser")).role;
		String serverData = "{\"serverData\": \"" + httpSession.getAttribute("loggedUser") + "\"}";

		if (this.mapSessions.get(sessionName) != null) {
			// Session already exists: return existing sessionId and a new token
			System.out.println("Existing session " + sessionName);
			try {
				String sessionId = this.mapSessions.get(sessionName).getSessionId();
				String token = this.mapSessions.get(sessionName)
						.generateToken(new TokenOptions.Builder().data(serverData).role(role).build());

				this.mapSessionIdsTokens.get(sessionId).put(token, OpenViduRole.PUBLISHER);

				model.addAttribute("sessionId", sessionId);
				model.addAttribute("token", token);
				model.addAttribute("nickName", clientData);
				model.addAttribute("userName", httpSession.getAttribute("loggedUser"));
				model.addAttribute("sessionName", sessionName);

				return "session";
			} catch (Exception e) {
				return "dashboard";
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

				model.addAttribute("sessionId", sessionId);
				model.addAttribute("token", token);
				model.addAttribute("nickName", clientData);
				model.addAttribute("userName", httpSession.getAttribute("loggedUser"));
				model.addAttribute("sessionName", sessionName);

				return "session";
			} catch (Exception e) {
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

		if (this.mapSessions.get(sessionName) != null) {
			String sessionId = this.mapSessions.get(sessionName).getSessionId();

			if (this.mapSessionIdsTokens.containsKey(sessionId)) {
				if (this.mapSessionIdsTokens.get(sessionId).remove(token) != null) {
					System.out.println(sessionName + ": " + this.mapSessionIdsTokens.get(sessionId).toString());
					// User left the session
					if (this.mapSessionIdsTokens.get(sessionId).isEmpty()) {
						// Last user left the session
						this.mapSessions.remove(sessionName);
						System.out.println(sessionName + " empty!");
					}
					model.addAttribute("sessionId", sessionId);
					return "redirect:/dashboard";
				} else {
					System.out.println("Problems in the app server: the TOKEN wasn't valid");
					return "redirect:/dashboard";
				}
			} else {
				System.out.println("Problems in the app server: the SESSIONID wasn't valid");
				return "redirect:/dashboard";
			}
		} else {
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
