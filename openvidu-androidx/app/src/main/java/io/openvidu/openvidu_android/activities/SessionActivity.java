package io.openvidu.openvidu_android.activities;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.DialogFragment;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;
import org.webrtc.EglBase;
import org.webrtc.MediaStream;
import org.webrtc.SurfaceViewRenderer;
import org.webrtc.VideoTrack;

import java.io.IOException;
import java.util.Objects;
import java.util.Random;

import io.openvidu.openvidu_android.R;
import io.openvidu.openvidu_android.databinding.ActivityMainBinding;
import io.openvidu.openvidu_android.fragments.PermissionsDialogFragment;
import io.openvidu.openvidu_android.openvidu.LocalParticipant;
import io.openvidu.openvidu_android.openvidu.RemoteParticipant;
import io.openvidu.openvidu_android.openvidu.Session;
import io.openvidu.openvidu_android.utils.CustomHttpClient;
import io.openvidu.openvidu_android.utils.OpenViduUtils;
import io.openvidu.openvidu_android.websocket.CustomWebSocket;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 *
 */
public class SessionActivity extends AppCompatActivity {

    /** Android */
    private static final int MY_PERMISSIONS_REQUEST_CAMERA = 100;
    private static final int MY_PERMISSIONS_REQUEST_RECORD_AUDIO = 101;
    private static final int MY_PERMISSIONS_REQUEST = 102;

    private SharedPreferences sharedPreferences = null; // initialized in onCreate

    /** Logging */
    private final String TAG = "SessionActivity";

    /** Layout */
    // View Binding for layout activity_main.xml; (initialized in onCreate)
    private ActivityMainBinding activityMainBinding = null;

    /** HTTP */
    static final String METHOD_POST = "POST";

    /** OpenVidu */
    static final String CONFIG_URL = "/config";
    static final String SESSION_URL = "/api/sessions";
    static final String TOKEN_URL = "/api/tokens";

    private String OPENVIDU_URL;
    private String OPENVIDU_SECRET; // WARNING: For example only; use login and user tokens in production
    private Session session;
    private CustomHttpClient httpClient;
    private static boolean bAuthenticated;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(TAG, "LIFECYCLE: onCreate");
        super.onCreate(savedInstanceState);

        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        loadSharedPreferences();

        // Initialize View Binding for activity_main and set content View
        // The class name "ActivityMainBinding" is automatically generated from the layout filename activity_main
        // https://developer.android.com/topic/libraries/view-binding
        activityMainBinding = ActivityMainBinding.inflate(getLayoutInflater());
        View rootView = activityMainBinding.getRoot();
        setContentView( rootView );

        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN);

        askForPermissions();

        generateRandomName();
    }

    private void loadSharedPreferences(){
        final String sharedPreferencesName = getString(R.string.main_shared_preferences);
        sharedPreferences = getSharedPreferences(sharedPreferencesName, Context.MODE_PRIVATE);
    }

    /**
     *
     */
    @Override
    protected void onStart() {
        Log.i(TAG, "LIFECYCLE: onStart");
        super.onStart();
    }

    /**
     * Restore state
     */
    @Override
    protected void onResume() {
        Log.i(TAG, "LIFECYCLE: onResume");
        super.onResume();

        if( bAuthenticated ) {
            viewToLoggedInState();
            initHttpClientUnsecure();
        }else{
            viewToLoggedOutState();
        }

        String urlString = sharedPreferences.getString(getString(R.string.sp_key_openvidu_url), getString(R.string.default_openvidu_url));
        activityMainBinding.openviduUrl.setText(urlString);
    }

    /**
     * Save state
     */
    @Override
    protected void onPause() {
        Log.i(TAG, "LIFECYCLE: onPause");
        super.onPause();

        SharedPreferences.Editor spEditor = sharedPreferences.edit();
        spEditor.putString(getSharedPrefKey(R.string.sp_openvidu_url), activityMainBinding.openviduUrl.getText().toString());
        spEditor.apply();
    }

    /**
     *
     */
    @Override
    protected void onStop() {
        Log.i(TAG, "LIFECYCLE: onStop");
        leaveSession();
        super.onStop();
    }

    /**
     *
     */
    @Override
    protected void onDestroy() {
        Log.i(TAG, "LIFECYCLE: onDestroy");
        leaveSession();
        super.onDestroy();
    }


    /**
     * Ask for permissions CAMERA and/or RECORD_AUDIO
     */
    public void askForPermissions() {
        boolean bCameraPermission
                = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        boolean bRecordAudioPermission
                = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

        if( !bCameraPermission && !bRecordAudioPermission ) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO}, MY_PERMISSIONS_REQUEST);
        } else if ( !bRecordAudioPermission ){
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO}, MY_PERMISSIONS_REQUEST_RECORD_AUDIO);
        } else if ( !bCameraPermission ) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA}, MY_PERMISSIONS_REQUEST_CAMERA);
        }
    }

    /**
     * This is a pseudo-login that performs an API request to see if it was successful.
     *
     * @param view
     */
    public void onClickLogin(View view) {
        initHttpClientUnsecure();
        verifyOpenViduAuthentication();
    }

    /**
     * Join or leave a session depending on the text value of id/start_finish_call.
     *
     * @param view
     */
    public void onClickStartFinishCall(View view) {
        try {
            boolean bInSession = activityMainBinding.startFinishCall.getText().equals("Leave session");
            if (bInSession) {
                leaveSession();
                return;
            }
            if (arePermissionGranted()) {
                initViews();
                viewToConnectingState();

                String sessionId = activityMainBinding.sessionName.getText().toString();
                joinOpenViduSession(sessionId);
            } else {
                DialogFragment permissionsFragment = new PermissionsDialogFragment();
                permissionsFragment.show(getSupportFragmentManager(), "Permissions Fragment");
            }
        }catch(Exception e){
            Log.e(TAG, e.toString());
            e.printStackTrace();
        }
    }

    /**
     * Initialize httpClient using the server's url and secret. This is
     * not a secure way to perform operations from the client-side -- convert to
     * login and user tokens in production.
     */
    private void initHttpClientUnsecure(){
        if( this.httpClient != null){
            this.httpClient.dispose();
        }
        OPENVIDU_URL = activityMainBinding.openviduUrl.getText().toString();
        OPENVIDU_SECRET = activityMainBinding.openviduSecret.getText().toString();
        httpClient = new CustomHttpClient(OPENVIDU_URL, OpenViduUtils.getBasicAuthString(OPENVIDU_SECRET));
    }

    /**
     * If authentication is successful, enable the ability to join sessions.
     */
    private void verifyOpenViduAuthentication(){
        try {
            httpClient.httpGet(CONFIG_URL, new Callback() {
                @SuppressLint("DefaultLocale")
                @Override
                public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException
                {
                    if( !response.isSuccessful() ){
                        Log.e(TAG, String.format("verifyOpenViduAuthentication(%d) - Response not successful", response.code()));
                        runOnUiThread( () -> {
                            Toast.makeText( getApplicationContext(),
                                    String.format("verifyOpenViduAuthentication(%d) - Response not successful", response.code()),
                                    Toast.LENGTH_SHORT).show();
                        });
                        return;
                    }
                    runOnUiThread( () -> {
                        Toast.makeText(getApplicationContext(), "Authentication Successful", Toast.LENGTH_SHORT).show();
                        viewToLoggedInState();
                    });
                }

                @Override
                public void onFailure(@NotNull Call call, @NotNull IOException e) {
                    runOnUiThread( () -> {
                        Toast.makeText(getApplicationContext(), "Authentication Failed", Toast.LENGTH_LONG).show();
                    });
                }

            });
        }catch( IOException e ){
            e.printStackTrace();
        }
    }

    /**
     * Create and/or join sessionId
     *
     * @param sessionId The customSessionId of the session.
     */
    private void joinOpenViduSession(String sessionId) {
        try {
            // HTTP POST sessionId to SESSION_URL
            MediaType jsonMediaType = MediaType.parse("application/json; charset=utf-8");
            String contentString = String.format("{\"customSessionId\": \"%s\"}", sessionId);
            RequestBody sessionBody = RequestBody.create(contentString, jsonMediaType);
            this.httpClient.httpCall(SESSION_URL, METHOD_POST, "application/json", sessionBody, new Callback(){
                /**
                 * WARNING: response.body().string() != response.body().toString(), e.g.
                 *          toString() = okhttp3.internal.http.RealResponseBody@fe18513
                 *          string() = {"id":"SessionA","createdAt":1593059100440}
                 *
                 * @param call
                 * @param response
                 * @throws IOException
                 */
                @Override
                public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException
                {
                    Log.d(TAG, String.format("joinOpenViduSession.httpCall(SESSION_URL).onResponse(): code = %d, body = %s", response.code(), response.body().string()));

                    // For example,
                    // If no session exists, code = 200 and response.body().string() = {"id":"SessionA","createdAt":1593059100440}
                    // If session already exists, code = 409 and response.body().string() is empty
                    if( response.code() != 200 && response.code() != 409 ) {
                        Log.e(TAG, "JoinOpenViduSession.httpCall(SESSION_URL) - unhandled error code");
                        return;
                    }

                    final String tokenRequestContent = "{\"session\": \"" + sessionId + "\"}";
                    final RequestBody tokenRequestBody = RequestBody.create(tokenRequestContent, jsonMediaType);
                    final String tokenContentType = "application/json";
                    httpClient.httpCall(TOKEN_URL, METHOD_POST, tokenContentType, tokenRequestBody, new Callback() {
                        @Override
                        public void onResponse(@NotNull Call call, @NotNull Response response) {
                            if( !response.isSuccessful() ){
                                Log.e(TAG, "joinOpenViduSession().httpCall(TOKEN_URL).onResponse() - Failed to get token");
                                return;
                            }

                            try {
                                // @requireNonNull - Throws NullPointerException with message
                                String jsonBodyString = Objects.requireNonNull(response.body(), "response body empty").string();
                                Log.d(TAG, String.format("joinOpenViduSession().httpCall(TOKEN_URL): jsonBody = %s", jsonBodyString));

                                if( jsonBodyString.isEmpty() ){
                                    Log.e(TAG, "JoinOpenViduSession().httpCall(TOKEN_URL): response empty");
                                    return;
                                }
                                try {
                                    JSONObject tokenJsonObject = new JSONObject(jsonBodyString);
                                    String tokenString = tokenJsonObject.getString("token");
                                    onSessionTokenReceived(tokenString, sessionId);
                                } catch (JSONException e) {
                                    Log.e(TAG, String.valueOf(e));
                                    e.printStackTrace();
                                }
                            }catch(NullPointerException | IOException e){
                                Log.e(TAG, String.valueOf(e));
                                e.printStackTrace();
                            }
                        }

                        @Override
                        public void onFailure(@NotNull Call call, @NotNull IOException e) {
                            Log.e(TAG, "Error POST /api/tokens", e);
                            connectionError();
                        }
                    });
                }

                @Override
                public void onFailure(@NotNull Call call, @NotNull IOException e) {
                    Log.e(TAG, "Error POST /api/sessions", e);
                    connectionError();
                }
            });
        } catch (IOException e) {
            Log.e(TAG, "Error getting token", e);
            e.printStackTrace();
            connectionError();
        }
    }

    private void onSessionTokenReceived(String token, String sessionId) {
        session = new Session(sessionId, token, activityMainBinding.viewsContainer, this);

        // Initialize our local participant and start local camera
        String participantName = activityMainBinding.participantName.getText().toString();
        LocalParticipant localParticipant = new LocalParticipant(
                participantName,
                session,
                this.getApplicationContext(),
                activityMainBinding.localGlSurfaceView);
        localParticipant.startCamera();

        // Update local participant view
        runOnUiThread(() -> {
            String participantNameString = activityMainBinding.participantName.getText().toString();
            activityMainBinding.mainParticipant.setText(participantNameString);
            activityMainBinding.mainParticipant.setPadding(20, 3, 20, 3);
        });

        // Initialize and connect the websocket to OpenVidu Server
        startWebSocket();
    }

    /**
     * Start custom OpenVidu web socket
     */
    private void startWebSocket() {
        CustomWebSocket webSocket = new CustomWebSocket(session, OPENVIDU_URL, this);
        webSocket.execute();
        session.setWebSocket(webSocket);
    }

    /**
     * On connection error, display a toast and transition the UI to disconnected state.
     */
    private void connectionError() {
        Runnable myRunnable = () -> {
            Toast toast = Toast.makeText(this, "Error connecting to " + OPENVIDU_URL, Toast.LENGTH_LONG);
            toast.show();
            viewToDisconnectedState();
        };
        new Handler(this.getMainLooper()).post(myRunnable);
    }

    /**
     *
     */
    private void viewToLoggedOutState(){
        bAuthenticated = false;
        activityMainBinding.sessionName.setEnabled(false);
        activityMainBinding.participantName.setEnabled(false);
        activityMainBinding.startFinishCall.setEnabled(false);
    }

    /**
     *
     */
    private void viewToLoggedInState(){
        bAuthenticated = true;
        activityMainBinding.sessionName.setEnabled(true);
        activityMainBinding.participantName.setEnabled(true);
        activityMainBinding.startFinishCall.setEnabled(true);
    }

    public void viewToDisconnectedState() {
        runOnUiThread(() -> {
            activityMainBinding.localGlSurfaceView.clearImage();
            activityMainBinding.localGlSurfaceView.release();
            activityMainBinding.startFinishCall.setText(getResources().getString(R.string.start_button));
            activityMainBinding.startFinishCall.setEnabled(true);
            activityMainBinding.openviduUrl.setEnabled(true);
            activityMainBinding.openviduUrl.setFocusableInTouchMode(true);
            activityMainBinding.openviduSecret.setEnabled(true);
            activityMainBinding.openviduSecret.setFocusableInTouchMode(true);
            activityMainBinding.sessionName.setEnabled(true);
            activityMainBinding.sessionName.setFocusableInTouchMode(true);
            activityMainBinding.participantName.setEnabled(true);
            activityMainBinding.participantName.setFocusableInTouchMode(true);
            activityMainBinding.mainParticipant.setText(null);
            activityMainBinding.mainParticipant.setPadding(0, 0, 0, 0);
        });
    }

    /**
     *
     */
    public void viewToConnectingState() {
        runOnUiThread(() -> {
            activityMainBinding.startFinishCall.setEnabled(false);
            activityMainBinding.openviduUrl.setEnabled(false);
            activityMainBinding.openviduUrl.setFocusable(false);
            activityMainBinding.openviduSecret.setEnabled(false);
            activityMainBinding.openviduSecret.setFocusable(false);
            activityMainBinding.sessionName.setEnabled(false);
            activityMainBinding.sessionName.setFocusable(false);
            activityMainBinding.participantName.setEnabled(false);
            activityMainBinding.participantName.setFocusable(false);
        });
    }

    /**
     *
     */
    public void viewToConnectedState() {
        runOnUiThread(() -> {
            activityMainBinding.startFinishCall.setText(getResources().getString(R.string.hang_up));
            activityMainBinding.startFinishCall.setEnabled(true);
        });
    }

    /**
     *
     * @param remoteParticipant
     */
    public void createRemoteParticipantVideo(final RemoteParticipant remoteParticipant) {
        Handler mainHandler = new Handler(this.getMainLooper());
        Runnable myRunnable = () -> {
            View rowView = this.getLayoutInflater().inflate(R.layout.peer_video, null);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 20);
            rowView.setLayoutParams(lp);
            int rowId = View.generateViewId();
            rowView.setId(rowId);
            activityMainBinding.viewsContainer.addView(rowView);
            SurfaceViewRenderer videoView = (SurfaceViewRenderer) ((ViewGroup) rowView).getChildAt(0);
            remoteParticipant.setVideoView(videoView);
            videoView.setMirror(false);
            EglBase rootEglBase = EglBase.create();
            videoView.init(rootEglBase.getEglBaseContext(), null);
            videoView.setZOrderMediaOverlay(true);
            View textView = ((ViewGroup) rowView).getChildAt(1);
            remoteParticipant.setParticipantNameText((TextView) textView);
            remoteParticipant.setView(rowView);

            remoteParticipant.getParticipantNameText().setText(remoteParticipant.getParticipantName());
            remoteParticipant.getParticipantNameText().setPadding(20, 3, 20, 3);
        };
        mainHandler.post(myRunnable);
    }

    /**
     *
     * @param stream
     * @param remoteParticipant
     */
    public void setRemoteMediaStream(MediaStream stream, final RemoteParticipant remoteParticipant) {
        final VideoTrack videoTrack = stream.videoTracks.get(0);
        videoTrack.addSink(remoteParticipant.getVideoView());
        runOnUiThread(() -> {
            remoteParticipant.getVideoView().setVisibility(View.VISIBLE);
        });
    }

    /**
     *
     */
    public void leaveSession() {
        try {
            this.session.leaveSession();
            this.httpClient.dispose();
            viewToDisconnectedState();
        }catch(Exception e){
            e.printStackTrace();
        }
    }

    /**
     *
     * @return
     */
    private boolean arePermissionGranted() {
        return (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_DENIED) &&
                (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_DENIED);
    }

    /**
     *
     */
    @Override
    public void onBackPressed() {
        leaveSession();
        super.onBackPressed();
    }

    /**
     * Initializes the surface view for the local participant.
     */
    private void initViews() {
        EglBase.Context rootEglBaseContext = EglBase.create().getEglBaseContext();
        activityMainBinding.localGlSurfaceView.init(rootEglBaseContext, null);
        activityMainBinding.localGlSurfaceView.setMirror(true);
        activityMainBinding.localGlSurfaceView.setEnableHardwareScaler(true);
        activityMainBinding.localGlSurfaceView.setZOrderMediaOverlay(true);
    }

    /**
     *
     */
    private void generateRandomName(){
        Random random = new Random();
        int randomIndex = random.nextInt(100);
        Editable randomName = activityMainBinding.participantName.getText().append(String.valueOf(randomIndex));
        activityMainBinding.participantName.setText( randomName );
    }

    private String getSharedPrefKey(int stringId) { return getSharedPrefString(stringId); }
    private String getString(int stringId){ return getResources().getString(stringId); }
}
