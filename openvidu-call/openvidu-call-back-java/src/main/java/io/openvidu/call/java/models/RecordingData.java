package io.openvidu.call.java.models;

public class RecordingData {
	
	String token;
	String recordingId;
	public RecordingData(String token, String recordingId) {
		this.token = token;
		this.recordingId = recordingId;
	}
	public String getToken() {
		return token;
	}
	public void setToken(String token) {
		this.token = token;
	}
	public String getRecordingId() {
		return recordingId;
	}
	public void setRecordingId(String recordingId) {
		this.recordingId = recordingId;
	}

}
