package io.openvidu.ipcameras;

import java.util.List;
import java.util.Map.Entry;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.SessionProperties;

/**
 * Rest controller that offers a single entry point ("/"), where users can
 * request for a token to enter the OpenVidu session if their credentials are
 * right. First time a user provides the required credentials, the OpenVidu
 * session will be created and the cameras will be published just before
 * generating and returning the user's token
 * 
 * @author Pablo Fuente (pablofuenteperez@gmail.com)
 */
@Controller
public class MyRestController {

	private static final Logger log = LoggerFactory.getLogger(App.class);

	private final String USER_CREDENTIALS = "PASSWORD";
	private final String SESSION_ID = "MySurveillanceSession";

	// OpenVidu objects
	private OpenVidu OV;
	private Session session;

	@RequestMapping(value = "/")
	public String subscribe(@RequestParam(name = "credentials", required = false) String credentials, Model model)
			throws OpenViduJavaClientException, OpenViduHttpException {

		if (credentials == null) {
			return "index";
		}
		try {
			checkCredentials(credentials);
		} catch (Exception e) {
			return generateError(model, "Wrong credentials");
		}

		// Create our surveillance session if not available yet
		if (OV == null || session == null) {
			try {
				createOpenViduSession();
				publishCameras();
			} catch (OpenViduJavaClientException | OpenViduHttpException e) {
				return generateError(model,
						"Error sending request to OpenVidu Server: " + e.getCause() + ". " + e.getMessage());
			}
		}

		// Create a Connection for the client
		ConnectionProperties connectionProperties = new ConnectionProperties.Builder()
				.type(ConnectionType.WEBRTC)
				.role(OpenViduRole.SUBSCRIBER)
				.build();
		String token = null;
		try {
			token = this.session.createConnection(connectionProperties).getToken();
		} catch (OpenViduHttpException e) {
			if (e.getStatus() == 404) {
				// Session was closed in openvidu-server. Re-create it
				createOpenViduSession();
				publishCameras();
				token = this.session.createConnection(connectionProperties).getToken();
			} else {
				return generateError(model,
						"Error creating Connection for session " + SESSION_ID + ": " + e.getMessage());
			}
		} catch (OpenViduJavaClientException e) {
			return generateError(model,
					"Error creating Connection for session " + SESSION_ID + ": " + e.getMessage());
		}

		model.addAttribute("token", token);
		return "index";
	}

	private void createOpenViduSession() throws OpenViduJavaClientException, OpenViduHttpException {
		// Init OpenVidu entrypoint object
		OV = new OpenVidu(App.OPENVIDU_URL, App.OPENVIDU_SECRET);
		// Get active sessions from OpenVidu Server
		OV.fetch();
		try {
			// See if our surveillance session is already created in OpenVidu Server
			session = OV.getActiveSessions().stream().filter(s -> s.getSessionId().equals(SESSION_ID)).findFirst()
					.get();
			log.info("Session {} already existed in OpenViduU Server", SESSION_ID);
		} catch (NoSuchElementException e) {
			// Create our surveillance session if it does not exist yet in OpenVidu Server
			log.info("Session {} does not in OpenViduU Servery yet. Creating it...", SESSION_ID);
			SessionProperties properties = new SessionProperties.Builder().customSessionId(SESSION_ID).build();
			session = OV.createSession(properties);
			log.info("Session {} created", SESSION_ID);
		}
	}

	private void publishCameras() throws OpenViduJavaClientException, OpenViduHttpException {

		// See if we have already published any of our cameras
		// We fetch our only session current status and search for connections with
		// platform "IPCAM". Finally we get their server data field with the camera name
		session.fetch();
		List<String> alreadyPublishedCameras = session.getActiveConnections().stream()
				.filter(connection -> "IPCAM".equals(connection.getPlatform()))
				.map(connection -> connection.getServerData()).collect(Collectors.toList());

		for (Entry<String, String> cameraMapEntry : App.IP_CAMERAS.entrySet()) {
			try {
				String cameraUri = cameraMapEntry.getValue();
				String cameraName = cameraMapEntry.getKey();
				// Publish the camera only if it is not already published
				if (!alreadyPublishedCameras.contains(cameraName)) {
					ConnectionProperties connectionProperties = new ConnectionProperties.Builder()
							.type(ConnectionType.IPCAM)
							.data(cameraName)
							.rtspUri(cameraUri)
							.adaptativeBitrate(true)
							.onlyPlayWithSubscribers(true)
							.build();
					session.createConnection(connectionProperties);
				}
			} catch (Exception e) {
				log.error("Error publishing camera {}", cameraMapEntry.getKey());
			}
		}
	}

	private void checkCredentials(String credentials) throws Exception {
		// Dummy security: if not expected string, then throw error
		if (!credentials.equals(USER_CREDENTIALS)) {
			throw new Exception();
		}
	}

	private String generateError(Model model, String message) {
		log.error(message);
		model.addAttribute("error", message);
		return "index";
	}

}
