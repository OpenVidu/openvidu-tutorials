package io.openvidu.openvidu_android.observers;

import android.util.Log;

import org.webrtc.SdpObserver;
import org.webrtc.SessionDescription;

public class CustomSdpObserver implements SdpObserver {

    private final String tag;

    public CustomSdpObserver(String tag) {
        this.tag = "SdpObserver-" + tag;
    }

    @Override
    public void onCreateSuccess(SessionDescription sdp) {
        Log.d(this.tag, "onCreateSuccess, SDP: " + sdp.toString());
    }

    @Override
    public void onSetSuccess() {
        Log.d(this.tag, "onSetSuccess");
    }

    @Override
    public void onCreateFailure(String error) {
        Log.e(this.tag, "onCreateFailure, error: " + error);
    }

    @Override
    public void onSetFailure(String error) {
        Log.e(this.tag, "onSetFailure, error: " + error);
    }
}
