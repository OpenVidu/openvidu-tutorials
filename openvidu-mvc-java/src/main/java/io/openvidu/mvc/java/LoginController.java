package io.openvidu.mvc.java;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import io.openvidu.java.client.OpenViduRole;

@Controller
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

	@RequestMapping(value = "/dashboard", method = { RequestMethod.GET, RequestMethod.POST })
	public String login(@RequestParam(name = "user", required = false) String user,
			@RequestParam(name = "pass", required = false) String pass, Model model, HttpSession httpSession) {

		String userName = (String) httpSession.getAttribute("loggedUser");
		if (userName != null) { // User is already logged
			model.addAttribute("username", userName);
			return "dashboard";
		}
		System.out.println("Logging in | {user, pass}={" + user + ", " + pass + "}");
		if (login(user, pass)) { // User is logging in
			System.out.println("'" + user + "' has logged in");
			httpSession.setAttribute("loggedUser", user);
			model.addAttribute("username", user);
			return "dashboard";
		} else {
			return "index";
		}
	}

	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String logout(Model model, HttpSession httpSession) {
		if (checkUserLogged(httpSession)) {
			model.addAttribute("username", httpSession.getAttribute("loggedUser"));
			return "dashboard";
		}
		httpSession.invalidate();
		return "index";
	}

	@RequestMapping(value = "/", method = RequestMethod.POST)
	public String logout(@RequestParam(name = "islogout", required = false) String islogout, HttpSession httpSession) {
		if (checkUserLogged(httpSession) && islogout.equals("true")){
			System.out.println("'" + httpSession.getAttribute("loggedUser") + "' has logged out");
			httpSession.invalidate();
		}
		return "index";
	}

	private boolean login(String user, String pass) {
		return (user != null && 
				pass != null && 
				users.containsKey(user) && users.get(user).pass.equals(pass));
	}

	private boolean checkUserLogged(HttpSession httpSession) {
		return !(httpSession == null || httpSession.getAttribute("loggedUser") == null);
	}
}