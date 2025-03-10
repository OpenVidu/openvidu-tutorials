package io.openvidu.openvidu_android.constants;

public final class JsonConstants {

    // RPC incoming methods
    public static final String PARTICIPANT_JOINED = "participantJoined";
    public static final String PARTICIPANT_PUBLISHED = "participantPublished";
    public static final String PARTICIPANT_UNPUBLISHED = "participantUnpublished";
    public static final String PARTICIPANT_LEFT = "participantLeft";
    public static final String PARTICIPANT_EVICTED = "participantEvicted";
    public static final String RECORDING_STARTED = "recordingStarted";
    public static final String RECORDING_STOPPED = "recordingStopped";
    public static final String SEND_MESSAGE = "sendMessage";
    public static final String STREAM_PROPERTY_CHANGED = "streamPropertyChanged";
    public static final String FILTER_EVENT_DISPATCHED = "filterEventDispatched";
    public static final String ICE_CANDIDATE = "iceCandidate";
    public static final String MEDIA_ERROR = "mediaError";

    // RPC outgoing methods
    public static final String JOINROOM_METHOD = "joinRoom";
    public static final String LEAVEROOM_METHOD = "leaveRoom";
    public static final String PUBLISHVIDEO_METHOD = "publishVideo";
    public static final String ONICECANDIDATE_METHOD = "onIceCandidate";
    public static final String RECEIVEVIDEO_METHOD = "receiveVideoFrom";
    public static final String UNSUBSCRIBEFROMVIDEO_METHOD = "unsubscribeFromVideo";
    public static final String SENDMESSAGE_ROOM_METHOD = "sendMessage";
    public static final String UNPUBLISHVIDEO_METHOD = "unpublishVideo";
    public static final String STREAMPROPERTYCHANGED_METHOD = "streamPropertyChanged";
    public static final String FORCEDISCONNECT_METHOD = "forceDisconnect";
    public static final String FORCEUNPUBLISH_METHOD = "forceUnpublish";
    public static final String APPLYFILTER_METHOD = "applyFilter";
    public static final String EXECFILTERMETHOD_METHOD = "execFilterMethod";
    public static final String REMOVEFILTER_METHOD = "removeFilter";
    public static final String ADDFILTEREVENTLISTENER_METHOD = "addFilterEventListener";
    public static final String REMOVEFILTEREVENTLISTENER_METHOD = "removeFilterEventListener";
    public static final String PING_METHOD = "ping";

    public static final String JSON_RPCVERSION = "2.0";

    public static final String VALUE = "value";
    public static final String PARAMS = "params";
    public static final String METHOD = "method";
    public static final String ID = "id";
    public static final String RESULT = "result";

    public static final String SESSION_ID = "sessionId";
    public static final String SDP_ANSWER = "sdpAnswer";
    public static final String METADATA = "metadata";

}