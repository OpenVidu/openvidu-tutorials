package io.openvidu.js.java;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpSession;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import io.openvidu.java.client.OpenViduRole;

@RestController
@RequestMapping("/api-login")
public class LoginController {

	public class MyUser {

		String name;
		String pass;
		OpenViduRole role;

		public MyUser(String name, String pass, OpenViduRole role) {
			this.name = name;
			this.pass = pass;
			this.role = role;
		}
	}

	public static Map<String, MyUser> users = new ConcurrentHashMap<>();

	public LoginController() {
		users.put("publisher1", new MyUser("publisher1", "pass", OpenViduRole.PUBLISHER));
		users.put("publisher2", new MyUser("publisher2", "pass", OpenViduRole.PUBLISHER));
		users.put("subscriber", new MyUser("subscriber", "pass", OpenViduRole.SUBSCRIBER));
	}

	@RequestMapping(value = "/login", method = RequestMethod.POST)
	public ResponseEntity<Object> login(@RequestBody String userPass, HttpSession httpSession) throws ParseException {

		System.out.println("Logging in | {user, pass}=" + userPass);
		// Retrieve params from POST body
		JSONObject userPassJson = (JSONObject) new JSONParser().parse(userPass);
		String user = (String) userPassJson.get("user");
		String pass = (String) userPassJson.get("pass");

		if (login(user, pass)) { // Correct user-pass
			// Validate session and return OK 
			// Value stored in HttpSession allows us to identify the user in future requests
			httpSession.setAttribute("loggedUser", user);
			return new ResponseEntity<>(HttpStatus.OK);
		} else { // Wrong user-pass
			// Invalidate session and return error
			httpSession.invalidate();
			return new ResponseEntity<>("User/Pass incorrect", HttpStatus.UNAUTHORIZED);
		}
	}

	@RequestMapping(value = "/logout", method = RequestMethod.POST)
	public ResponseEntity<Object> logout(HttpSession session) {
		System.out.println("'" + session.getAttribute("loggedUser") + "' has logged out");
		session.invalidate();
		return new ResponseEntity<>(HttpStatus.OK);
	}

	private boolean login(String user, String pass) {
		return (users.containsKey(user) && users.get(user).pass.equals(pass));
	}

}
