
$(document).ready(async() => {
    var webComponent = document.querySelector('openvidu-webcomponent');
    var form = document.getElementById('main');

    webComponent.addEventListener('onSessionCreated', (event) => {
        var session = event.detail;

        // You can see the session documentation here
        // https://docs.openvidu.io/en/stable/api/openvidu-browser/classes/session.html

        session.on('connectionCreated', (e) => {
            console.log("connectionCreated", e);
        });

        session.on('streamDestroyed', (e) => {
            console.log("streamDestroyed", e);
        });

        session.on('streamCreated', (e) => {
            console.log("streamCreated", e);
        });

        session.on('sessionDisconnected', (event) => {
            console.warn("sessionDisconnected event");
            form.style.display = 'block';
            webComponent.style.display = 'none';
        });

        session.on('exception', (exception) => {
            console.error(exception);
        });
    });

    webComponent.addEventListener('onJoinButtonClicked', (event) => {});
    webComponent.addEventListener('onToolbarLeaveButtonClicked', (event) => {});
    webComponent.addEventListener('onToolbarCameraButtonClicked', (event) => {});
    webComponent.addEventListener('onToolbarMicrophoneButtonClicked', (event) => {});
    webComponent.addEventListener('onToolbarScreenshareButtonClicked', (event) => {});
    webComponent.addEventListener('onToolbarParticipantsPanelButtonClicked', (event) => {});
    webComponent.addEventListener('onToolbarChatPanelButtonClicked', (event) => {});
    webComponent.addEventListener('onToolbarFullscreenButtonClicked', (event) => {});
    webComponent.addEventListener('onParticipantCreated', (event) => {});

});

async function joinSession() {
    //Getting form inputvalue
    var sessionName = document.getElementById('sessionName').value;
    var participantName = document.getElementById('user').value;

    // Requesting tokens
    var promiseResults = await Promise.all([getToken(sessionName), getToken(sessionName)]);
    var tokens = {webcam: promiseResults[0], screen: promiseResults[1]};

    //Getting the webcomponent element
    var webComponent = document.querySelector('openvidu-webcomponent');

    hideForm();

    // Displaying webcomponent
    webComponent.style.display = 'block';

    // webComponent.participantName = participantName;

    // You can see the UI parameters documentation here
    // https://docs.openvidu.io/en/stable/api/openvidu-angular/components/OpenviduWebComponentComponent.html#inputs

    // webComponent.toolbarScreenshareButton = false;
    // webComponent.minimal = true;
    // webComponent.prejoin = true;

    // webComponent.videoMuted = false;
    // webComponent.audioMuted = false;

    // webComponent.toolbarScreenshareButton = true;
    // webComponent.toolbarFullscreenButton = true;
	// webComponent.toolbarLeaveButton = true;
	// webComponent.toolbarChatPanelButton = true;
	// webComponent.toolbarParticipantsPanelButton = true;
	// webComponent.toolbarDisplayLogo = true;
	// webComponent.toolbarDisplaySessionName = true;
	// webComponent.streamDisplayParticipantName = true;
	// webComponent.streamDisplayAudioDetection = true;
	// webComponent.streamSettingsButton = true;
	// webComponent.participantPanelItemMuteButton = true;

    webComponent.tokens = tokens;
}

function hideForm() {
    var form = document.getElementById('main');
    form.style.display = 'none';

}

/**
 * --------------------------
 * SERVER-SIDE RESPONSIBILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
 *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
 *   3) The Connection.token must be consumed in Session.connect() method
 */

var OPENVIDU_SERVER_URL = "https://localhost:4443";
var OPENVIDU_SERVER_SECRET = 'MY_SECRET';

function getToken(sessionName) {
    return createSession(sessionName).then((sessionId) => createToken(sessionId));
}

function createSession(sessionName) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessions
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/openvidu/api/sessions',
            data: JSON.stringify({ customSessionId: sessionName }),
            headers: {
                Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                'Content-Type': 'application/json',
            },
            success: (response) => resolve(response.id),
            error: (error) => {
                if (error.status === 409) {
                    resolve(sessionName);
                } else {
                    console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + OPENVIDU_SERVER_URL);
                    if (
                        window.confirm(
                            'No connection to OpenVidu Server. This may be a certificate error at "' +
                                OPENVIDU_SERVER_URL +
                                '"\n\nClick OK to navigate and accept it. ' +
                                'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                                OPENVIDU_SERVER_URL +
                                '"',
                        )
                    ) {
                        location.assign(OPENVIDU_SERVER_URL + '/accept-certificate');
                    }
                }
            },
        });
    });
}

function createToken(sessionId) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessionsltsession_idgtconnection
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/openvidu/api/sessions/' + sessionId + '/connection',
            data: JSON.stringify({}),
            headers: {
                'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                'Content-Type': 'application/json',
            },
            success: (response) => resolve(response.token),
            error: (error) => reject(error)
        });
    });
}
