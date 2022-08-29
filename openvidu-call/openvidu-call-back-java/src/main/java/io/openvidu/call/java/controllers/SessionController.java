package io.openvidu.call.java.controllers;

import java.util.ArrayList;
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
import org.springframework.web.bind.annotation.RestController;

import io.openvidu.call.java.models.RecordingData;
import io.openvidu.call.java.services.OpenViduService;
import io.openvidu.java.client.Connection;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Recording;
import io.openvidu.java.client.Session;

@CrossOrigin(origins = "*")
@RestController
public class SessionController {

	@Value("${RECORDING}")
	private String RECORDING;

	@Autowired
	private OpenViduService openviduService;

	@PostMapping("/sessions")
	public ResponseEntity<Map<String, Object>> createConnection(
			@RequestBody(required = false) Map<String, Object> params,
			@CookieValue(name = OpenViduService.RECORDING_TOKEN_NAME, defaultValue = "") String recordingTokenCookie,
			HttpServletResponse res) {

		Map<String, Object> response = new HashMap<String, Object>();
		try {
			long date = -1;
			String nickname = "";

			String sessionId = params.get("sessionId").toString();
			if (params.containsKey("nickname")) {
				nickname = params.get("nickname").toString();
			}

			Session sessionCreated = this.openviduService.createSession(sessionId);
			boolean IS_RECORDING_ENABLED = RECORDING.toUpperCase().equals("ENABLED");

			boolean hasValidToken = this.openviduService.isValidToken(sessionId, recordingTokenCookie);
			boolean isSessionCreator = hasValidToken || sessionCreated.getActiveConnections().size() == 0;

			OpenViduRole role = isSessionCreator && IS_RECORDING_ENABLED ? OpenViduRole.MODERATOR
					: OpenViduRole.PUBLISHER;

			response.put("recordingEnabled", IS_RECORDING_ENABLED);
			response.put("recordings", new ArrayList<Recording>());

			Connection cameraConnection = this.openviduService.createConnection(sessionCreated, nickname, role);
			Connection screenConnection = this.openviduService.createConnection(sessionCreated, nickname, role);

			response.put("cameraToken", cameraConnection.getToken());
			response.put("screenToken", screenConnection.getToken());

			if (IS_RECORDING_ENABLED && isSessionCreator && !hasValidToken) {
				/**
				 * ! *********** WARN *********** !
				 *
				 * To identify who is able to manage session recording, the code sends a cookie
				 * with a token to the session creator. The relation between cookies and
				 * sessions are stored in backend memory.
				 *
				 * This authentication & authorization system is pretty basic and it is not for
				 * production. We highly recommend IMPLEMENT YOUR OWN USER MANAGEMENT with
				 * persistence for a properly and secure recording feature.
				 *
				 * ! *********** WARN *********** !
				 **/

				String uuid = UUID.randomUUID().toString();
				date = System.currentTimeMillis();
				String recordingToken = cameraConnection.getToken() + "&" + OpenViduService.RECORDING_TOKEN_NAME + "="
						+ uuid + "&createdAt=" + date;

				Cookie cookie = new Cookie(OpenViduService.RECORDING_TOKEN_NAME, recordingToken);
				res.addCookie(cookie);

				RecordingData recData = new RecordingData(recordingToken, "");
				this.openviduService.recordingMap.put(sessionId, recData);
			}

			if (IS_RECORDING_ENABLED) {
				if (date == -1) {
					date = openviduService.getDateFromCookie(recordingTokenCookie);
				}
				List<Recording> recordings = openviduService.listRecordingsBySessionIdAndDate(sessionId, date);
				response.put("recordings", recordings);
			}

			return new ResponseEntity<>(response, HttpStatus.OK);

		} catch (OpenViduJavaClientException | OpenViduHttpException e) {

			if (e.getMessage() != null && Integer.parseInt(e.getMessage()) == 501) {
				System.err.println("OpenVidu Server recording module is disabled");
				response.put("recordingEnabled", false);
				return new ResponseEntity<>(response, HttpStatus.OK);
			} else if (e.getMessage() != null && Integer.parseInt(e.getMessage()) == 401) {
				System.err.println("OpenVidu credentials are wrong.");
				return new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED);

			} else {
				e.printStackTrace();
				System.err.println(e.getMessage());
				return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}

}
