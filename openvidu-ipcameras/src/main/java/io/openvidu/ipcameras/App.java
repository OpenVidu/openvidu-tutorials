package io.openvidu.ipcameras;

import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.PropertySource;

/**
 * Run this application with the following command:
 * 
 * java -jar -Dopenvidu-url=https://your.url.com -Dopenvidu-secret=your_secret openvidu-ipcameras-1.0.0.jar
 * 
 * @author Pablo Fuente (pablofuenteperez@gmail.com)
 */
@SpringBootApplication
@PropertySource("classpath:application.properties")
public class App {

	private static final Logger log = LoggerFactory.getLogger(App.class);

	static String OPENVIDU_URL;
	static String OPENVIDU_SECRET;
	static Map<String, String> IP_CAMERAS = new HashMap<String, String>() {
		{
		 	put("Amsterdam", "http://92.110.185.114:8080/mjpg/video.mjpg");
		 	put("Czech Republic", "http://185.137.146.14:80/mjpg/video.mjpg");
			put("Japan bridge", "http://211.132.61.124:80/mjpg/video.mjpg");
		}
	};

	public static void main(String[] args) {

		// Start application
		ConfigurableApplicationContext context = SpringApplication.run(App.class, args);

		OPENVIDU_URL = context.getEnvironment().getProperty("openvidu-url");
		OPENVIDU_SECRET = context.getEnvironment().getProperty("openvidu-secret");

		// Check OPENVIDU_URL parameter
		try {
			new URL(OPENVIDU_URL).toURI();
			OPENVIDU_URL = OPENVIDU_URL.endsWith("/") ? OPENVIDU_URL : (OPENVIDU_URL + "/");
		} catch (MalformedURLException | URISyntaxException e) {
			log.error("Parameter \"openvidu-url\" ({}) has not a valid URL format", OPENVIDU_URL);
			System.exit(1);
		}
		log.info("OpenVidu URL is {}", OPENVIDU_URL);
		log.info("OpenVidu secret is {}", OPENVIDU_SECRET);
		log.info("Camera list is {}", IP_CAMERAS.toString());
	}

}
