package io.openvidu.call.java.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.openvidu.call.java.services.OpenViduService;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.Recording;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("admin")
public class AdminController {

	@Value("${ADMIN_SECRET}")
	private String ADMIN_SECRET;

	@Autowired
	private OpenViduService openviduService;

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody(required = false) Map<String, String> params,
			@CookieValue(name = OpenViduService.RECORDING_TOKEN_NAME, defaultValue = "") String recordingToken, HttpServletResponse res) {
		
		String message = "";
		Map<String, Object> response = new HashMap<String, Object>();
		
		String password = params.get("password");
		String sessionToken = this.openviduService.getSessionIdFromCookie(recordingToken);
		boolean isAdminTokenValid = this.openviduService.adminTokens.contains(sessionToken);

		boolean isAuthValid = password.equals(ADMIN_SECRET) || isAdminTokenValid;
		if (isAuthValid) {
			try {
				if (sessionToken.isEmpty() || !openviduService.adminTokens.contains(sessionToken)) {
					// Save session token
					String token = UUID.randomUUID().toString();

					Cookie cookie = new Cookie(OpenViduService.ADMIN_TOKEN_NAME, token);
					cookie.setPath("/");
					res.addCookie(cookie);

					cookie = new Cookie("session", token);
					cookie.setPath("/");
					res.addCookie(cookie);

					openviduService.adminTokens.add(token);
				}
				List<Recording> recordings = openviduService.listAllRecordings();
				System.out.println("Login succeeded");
				System.out.println(recordings.size() + " Recordings found");
				response.put("recordings", recordings);

				return new ResponseEntity<>(response, HttpStatus.OK);
			} catch (OpenViduJavaClientException | OpenViduHttpException error) {
				
				if(Integer.parseInt(error.getMessage()) == 501) {
					System.err.println(error.getMessage() + ". OpenVidu Server recording module is disabled.");
					return new ResponseEntity<>(response, HttpStatus.OK);
				} else {
					message = error.getMessage() + " Unexpected error getting recordings";
					error.printStackTrace();
					System.err.println(message);
					return new ResponseEntity<>(message, HttpStatus.INTERNAL_SERVER_ERROR);
				}

			}
		} else {
			message = "Permissions denied";
			System.err.println(message);
			return new ResponseEntity<>(null, HttpStatus.FORBIDDEN);
		}

	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@RequestBody(required = false) Map<String, String> params,
			@CookieValue(name = "session", defaultValue = "") String sessionToken,
			HttpServletResponse res) {
		this.openviduService.adminTokens.remove(sessionToken);
		Cookie cookie = new Cookie("session", null);
		res.addCookie(cookie);
		return new ResponseEntity<>(null, HttpStatus.OK);

	}

}
