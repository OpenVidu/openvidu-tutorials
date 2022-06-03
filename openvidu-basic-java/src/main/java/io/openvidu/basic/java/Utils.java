package io.openvidu.basic.java;

import java.util.List;
import java.util.Map;

import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.IceServerProperties;
import io.openvidu.java.client.KurentoOptions;
import io.openvidu.java.client.MediaMode;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Recording.OutputMode;
import io.openvidu.java.client.RecordingLayout;
import io.openvidu.java.client.RecordingMode;
import io.openvidu.java.client.RecordingProperties;
import io.openvidu.java.client.SessionProperties;
import io.openvidu.java.client.VideoCodec;

/**
 * This class transforms raw REST API parameters to OpenVidu Java SDK classes
 */
public class Utils {

	public SessionProperties generateSessionProperties(Map<String, Object> params) {
		SessionProperties.Builder builder = new SessionProperties.Builder();
		if (params.containsKey("mediaMode")) {
			builder.mediaMode(MediaMode.valueOf((String) params.get("mediaMode")));
		}
		if (params.containsKey("recordingMode")) {
			builder.recordingMode(RecordingMode.valueOf((String) params.get("recordingMode")));
		}
		if (params.containsKey("customSessionId")) {
			builder.customSessionId((String) params.get("customSessionId"));
		}
		if (params.containsKey("forcedVideoCodec")) {
			builder.forcedVideoCodec(VideoCodec.valueOf((String) params.get("forcedVideoCodec")));
		}
		if (params.containsKey("allowTranscoding")) {
			builder.allowTranscoding((Boolean) params.get("allowTranscoding"));
		}
		if (params.containsKey("defaultRecordingProperties")) {
			RecordingProperties.Builder defaultRecordingProperties = new RecordingProperties.Builder();
			Map<String, Object> recordingProperties = (Map<String, Object>) params.get("defaultRecordingProperties");
			if (recordingProperties.containsKey("name")) {
				defaultRecordingProperties.name((String) recordingProperties.get("name"));
			}
			if (recordingProperties.containsKey("hasAudio")) {
				defaultRecordingProperties.hasAudio((boolean) recordingProperties.get("hasAudio"));
			}
			if (recordingProperties.containsKey("hasVideo")) {
				defaultRecordingProperties.hasVideo((boolean) recordingProperties.get("hasVideo"));
			}
			if (recordingProperties.containsKey("outputMode")) {
				defaultRecordingProperties
						.outputMode(OutputMode.valueOf((String) recordingProperties.get("outputMode")));
			}
			if (recordingProperties.containsKey("recordingLayout")) {
				defaultRecordingProperties
						.recordingLayout(RecordingLayout.valueOf((String) recordingProperties.get("recordingLayout")));
			}
			if (recordingProperties.containsKey("resolution")) {
				defaultRecordingProperties.resolution((String) recordingProperties.get("resolution"));
			}
			if (recordingProperties.containsKey("frameRate")) {
				defaultRecordingProperties.frameRate((int) recordingProperties.get("frameRate"));
			}
			if (recordingProperties.containsKey("shmSize")) {
				defaultRecordingProperties.shmSize((long) recordingProperties.get("shmSize"));
			}
			if (recordingProperties.containsKey("ignoreFailedStreams")) {
				defaultRecordingProperties
						.ignoreFailedStreams((boolean) recordingProperties.get("ignoreFailedStreams"));
			}
			if (recordingProperties.containsKey("mediaNode")) {
				Map<String, Object> mediaNodeInfo = (Map<String, Object>) recordingProperties.get("mediaNode");
				if (mediaNodeInfo.containsKey("id")) {
					defaultRecordingProperties.mediaNode((String) mediaNodeInfo.get("id"));
				}
			}
		}
		return builder.build();
	}

	public ConnectionProperties generateConnectionProperties(Map<String, Object> params) {
		ConnectionProperties.Builder builder = new ConnectionProperties.Builder();
		if (params.containsKey("type")) {
			builder.type(ConnectionType.valueOf((String) params.get("type")));
		}
		if (params.containsKey("data")) {
			builder.data((String) params.get("data"));
		}
		if (params.containsKey("record")) {
			builder.record((boolean) params.get("record"));
		}
		if (params.containsKey("role")) {
			builder.role(OpenViduRole.valueOf((String) params.get("role")));
		}
		if (params.containsKey("rtspUri")) {
			builder.rtspUri((String) params.get("rtspUri"));
		}
		if (params.containsKey("adaptativeBitrate")) {
			builder.adaptativeBitrate((boolean) params.get("adaptativeBitrate"));
		}
		if (params.containsKey("onlyPlayWithSubscribers")) {
			builder.onlyPlayWithSubscribers((boolean) params.get("onlyPlayWithSubscribers"));
		}
		if (params.containsKey("networkCache")) {
			builder.networkCache((int) params.get("networkCache"));
		}
		if (params.containsKey("kurentoOptions")) {
			Map<String, Object> kurentoOptions = (Map<String, Object>) params.get("kurentoOptions");
			KurentoOptions.Builder kurentoOptionsBuilder = new KurentoOptions.Builder();
			if (kurentoOptions.containsKey("videoMaxRecvBandwidth")) {
				kurentoOptionsBuilder.videoMaxRecvBandwidth((int) kurentoOptions.get("videoMaxRecvBandwidth"));
			}
			if (kurentoOptions.containsKey("videoMinRecvBandwidth")) {
				kurentoOptionsBuilder.videoMinRecvBandwidth((int) kurentoOptions.get("videoMinRecvBandwidth"));
			}
			if (kurentoOptions.containsKey("videoMaxSendBandwidth")) {
				kurentoOptionsBuilder.videoMaxSendBandwidth((int) kurentoOptions.get("videoMaxSendBandwidth"));
			}
			if (kurentoOptions.containsKey("videoMinSendBandwidth")) {
				kurentoOptionsBuilder.videoMinSendBandwidth((int) kurentoOptions.get("videoMinSendBandwidth"));
			}
			if (kurentoOptions.containsKey("allowedFilters")) {
				List<String> allowedFiltersList = (List<String>) kurentoOptions.get("allowedFilters");
				String[] allowedFiltersArray = allowedFiltersList.stream().toArray(String[]::new);
				kurentoOptionsBuilder.allowedFilters(allowedFiltersArray);
			}
			builder.kurentoOptions(kurentoOptionsBuilder.build());
		}
		if (params.containsKey("customIceServers")) {
			List<Map<String, String>> customIceServersList = (List<Map<String, String>>) params.get("customIceServers");
			for (Map<String, String> iceServer : customIceServersList) {
				IceServerProperties.Builder iceServerBuilder = new IceServerProperties.Builder();
				iceServerBuilder.url(iceServer.get("url"));
				iceServerBuilder.username(iceServer.get("username"));
				iceServerBuilder.credential(iceServer.get("credential"));
				IceServerProperties iceServerProperties = iceServerBuilder.build();
				builder.addCustomIceServer(iceServerProperties);
			}
		}
		return builder.build();
	}

}
