package io.openvidu.recording.java.test;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.TimeUnit;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringUtils;
import org.junit.Assert;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.platform.runner.JUnitPlatform;
import org.junit.runner.RunWith;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.github.bonigarcia.seljup.SeleniumExtension;
import io.github.bonigarcia.wdm.WebDriverManager;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.Recording;
import io.openvidu.java.client.Recording.OutputMode;
import io.openvidu.test.browsers.BrowserUser;
import io.openvidu.test.browsers.ChromeUser;
import ws.schild.jave.EncoderException;
import ws.schild.jave.MultimediaInfo;
import ws.schild.jave.MultimediaObject;

/**
 * E2E tests for openvidu-java-recording app
 * 
 * mvn -Dtest=AppTestE2e -DAPP_URL=https://localhost:5000/
 * -DOPENVIDU_URL=https://localhost:4443/ -DOPENVIDU_SECRET=MY_SECRET
 * -DNUMBER_OF_ATTEMPTS=30 -DRECORDING_DURATION=5 -DDURATION_THRESHOLD=5 test
 * 
 * @author Pablo Fuente (pablofuenteperez@gmail.com)
 */
@DisplayName("E2E tests for openvidu-java-recording")
@ExtendWith(SeleniumExtension.class)
@RunWith(JUnitPlatform.class)
public class AppTestE2e {

	private static final Logger log = LoggerFactory.getLogger(AppTestE2e.class);

	static String OPENVIDU_SECRET = "MY_SECRET";
	static String OPENVIDU_URL = "https://localhost:4443/";
	static String APP_URL = "https://localhost:5000/";
	static int NUMBER_OF_ATTEMPTS = 10;
	static int RECORDING_DURATION = 5; // seconds
	static double DURATION_THRESHOLD = 10.0; // seconds

	static String RECORDING_PATH = "/opt/openvidu/recordings/";

	private BrowserUser user;
	private static OpenVidu OV;

	boolean deleteRecordings = true;

	@BeforeAll()
	static void setupAll() {

		WebDriverManager.chromedriver().setup();

		String appUrl = System.getProperty("APP_URL");
		if (appUrl != null) {
			APP_URL = appUrl;
		}
		log.info("Using URL {} to connect to openvidu-recording-java app", APP_URL);

		String openviduUrl = System.getProperty("OPENVIDU_URL");
		if (openviduUrl != null) {
			OPENVIDU_URL = openviduUrl;
		}
		log.info("Using URL {} to connect to openvidu-server", OPENVIDU_URL);

		String openvidusecret = System.getProperty("OPENVIDU_SECRET");
		if (openvidusecret != null) {
			OPENVIDU_SECRET = openvidusecret;
		}
		log.info("Using secret {} to connect to openvidu-server", OPENVIDU_SECRET);

		String numberOfAttempts = System.getProperty("NUMBER_OF_ATTEMPTS");
		if (numberOfAttempts != null) {
			NUMBER_OF_ATTEMPTS = Integer.parseInt(numberOfAttempts);
		}
		log.info("Number of attempts: {}", NUMBER_OF_ATTEMPTS);

		String recordingDuration = System.getProperty("RECORDING_DURATION");
		if (recordingDuration != null) {
			RECORDING_DURATION = Integer.parseInt(recordingDuration);
		}
		log.info("Recording duration: {} s", RECORDING_DURATION);

		String durationThreshold = System.getProperty("DURATION_THRESHOLD");
		if (durationThreshold != null) {
			DURATION_THRESHOLD = Double.parseDouble(durationThreshold);
		}
		log.info("Duration threshold: {} s", DURATION_THRESHOLD);

		String recordingPath = System.getProperty("RECORDING_PATH");
		if (recordingPath != null) {
			recordingPath = recordingPath.endsWith("/") ? recordingPath : recordingPath + "/";
			RECORDING_PATH = recordingPath;
		}
		log.info("Using recording path {} to search for recordings", RECORDING_PATH);

		try {
			log.info("Cleaning folder {}", RECORDING_PATH);
			FileUtils.cleanDirectory(new File(RECORDING_PATH));
		} catch (IOException e) {
			log.error(e.getMessage());
		}
		OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
	}

	@AfterEach()
	void dispose() {
		try {
			OV.fetch();
		} catch (OpenViduJavaClientException | OpenViduHttpException e1) {
			log.error("Error fetching sessions: {}", e1.getMessage());
		}
		OV.getActiveSessions().forEach(session -> {
			try {
				session.close();
				log.info("Session {} successfully closed", session.getSessionId());
			} catch (OpenViduJavaClientException | OpenViduHttpException e2) {
				log.error("Error closing session: {}", e2.getMessage());
			}
		});
		if (deleteRecordings) {
			try {
				OV.listRecordings().forEach(recording -> {
					if (recording.getStatus().equals(Recording.Status.started)) {
						try {
							OV.stopRecording(recording.getId());
							log.info("Recording {} successfully stopped", recording.getId());
						} catch (OpenViduJavaClientException | OpenViduHttpException e) {
							log.error("Error stopping recording {}: {}", recording.getId(), e.getMessage());
						}
					}
					try {
						OV.deleteRecording(recording.getId());
						log.info("Recording {} successfully deleted", recording.getId());
					} catch (OpenViduJavaClientException | OpenViduHttpException e1) {
						log.error("Error deleting recording {}: {}", recording.getId(), e1.getMessage());
					}
				});
			} catch (OpenViduJavaClientException | OpenViduHttpException e2) {
				log.error("Error listing recordings: {}", e2.getMessage());
			}
		}
		this.user.dispose();
	}

	void setupBrowser() {
		user = new ChromeUser("TestUser", 20, false);
		user.getDriver().manage().timeouts().setScriptTimeout(20, TimeUnit.SECONDS);
		user.getDriver().manage().window().setSize(new Dimension(1920, 1080));
	}

	@Test
	@DisplayName("Composed recording test")
	void composedRecordingTest() throws Exception {

		boolean durationDifferenceAcceptable = true;
		int i = 0;

		double realTimeDuration = 0;
		double entityDuration = 0;
		String videoFile = "";

		setupBrowser();
		user.getDriver().get(APP_URL);

		user.getDriver().findElement(By.id("join-btn")).click();
		waitUntilEvents("connectionCreated", "videoElementCreated", "accessAllowed", "streamCreated", "streamPlaying");

		user.getDriver().findElement(By.id("has-video-checkbox")).click();

		while (durationDifferenceAcceptable && (i < NUMBER_OF_ATTEMPTS)) {

			log.info("----------");
			log.info("Attempt {}", i + 1);
			log.info("----------");

			user.getDriver().findElement(By.id("buttonStartRecording")).click();

			waitUntilEvents("recordingStarted");

			Thread.sleep(RECORDING_DURATION * 1000);

			user.getDriver().findElement(By.id("buttonStopRecording")).click();
			waitUntilEvents("recordingStopped");

			Recording rec = OV.listRecordings().get(0);

			String extension = rec.getOutputMode().equals(OutputMode.COMPOSED) && rec.hasVideo() ? ".mp4" : ".webm";

			videoFile = RECORDING_PATH + rec.getId() + "/" + rec.getName() + extension;
			realTimeDuration = getRealTimeDuration(videoFile);
			entityDuration = rec.getDuration();

			double differenceInDurations = (double) Math.abs(realTimeDuration - entityDuration);

			log.info("Real media file duration: {} s", realTimeDuration);
			log.info("Entity file duration: {} s", entityDuration);
			log.info("Difference between durations: {} s", differenceInDurations);

			durationDifferenceAcceptable = differenceInDurations < DURATION_THRESHOLD;
			i++;

			if (durationDifferenceAcceptable) {
				// Delete acceptable recording
				try {
					OV.deleteRecording(rec.getId());
					log.info("Recording {} was acceptable and is succesfully deleted", rec.getId());
				} catch (OpenViduJavaClientException | OpenViduHttpException e) {
					log.error("Error deleteing acceptable recording {}: {}", rec.getId(), e.getMessage());
				}
			}
		}
		if (i == NUMBER_OF_ATTEMPTS) {
			log.info("Media file recorded with Composite has not exceeded the duration threshold ({} s) in {} attempts",
					DURATION_THRESHOLD, NUMBER_OF_ATTEMPTS);
		} else {
			log.error(
					"Real video duration recorded with Composite ({} s) exceeds threshold of {} s compared to entity duration ({} s), in file {}",
					realTimeDuration, DURATION_THRESHOLD, entityDuration, videoFile);
			deleteRecordings = false;
			Assert.fail("Real video duration recorded with Composite (" + realTimeDuration + " s) exceeds threshold of "
					+ DURATION_THRESHOLD + " s compared to entity duration (" + entityDuration + " s), in file "
					+ videoFile);
		}
	}

	private void waitUntilEvents(String... events) {
		user.getWaiter().until(eventsToBe(events));
		user.getDriver().findElement(By.id("clear-events-btn")).click();
		user.getWaiter().until(ExpectedConditions.textToBePresentInElementLocated(By.id("textarea-events"), ""));
	}

	private ExpectedCondition<Boolean> eventsToBe(String... events) {
		final Map<String, Integer> expectedEvents = new HashMap<>();
		for (String event : events) {
			Integer currentNumber = expectedEvents.get(event);
			if (currentNumber == null) {
				expectedEvents.put(event, 1);
			} else {
				expectedEvents.put(event, currentNumber++);
			}
		}
		return new ExpectedCondition<Boolean>() {
			@Override
			public Boolean apply(WebDriver driver) {
				boolean eventsCorrect = true;
				String events = driver.findElement(By.id("textarea-events")).getText();

				for (Entry<String, Integer> entry : expectedEvents.entrySet()) {
					eventsCorrect = eventsCorrect
							&& StringUtils.countMatches(events, entry.getKey()) == entry.getValue();
					if (!eventsCorrect) {
						break;
					}
				}
				return eventsCorrect;
			}

			@Override
			public String toString() {
				return " OpenVidu events " + expectedEvents.toString();
			}
		};
	}

	private double getRealTimeDuration(String pathToVideoFile) {
		long time = 0;
		File source = new File(pathToVideoFile);
		try {
			MultimediaObject media = new MultimediaObject(source);
			MultimediaInfo info = media.getInfo();
			time = info.getDuration();
		} catch (EncoderException e) {
			log.error("Error getting MultimediaInfo from file {}: {}", pathToVideoFile, e.getMessage());
		}
		return (double) time / 1000;
	}

}
