$(document).ready(() => {
    var webComponent = document.querySelector('openvidu-webcomponent');
    var form = document.getElementById('main');

    webComponent.addEventListener('joinSession', (event) => {
        form.style.display = 'none';
        webComponent.style.display = 'block';
    });
    webComponent.addEventListener('leaveSession', (event) => {
        form.style.display = 'block';
        webComponent.style.display = 'none';
    });
    webComponent.addEventListener('error', (event) => {
        console.log('Error event', event.detail);
    });
});

function joinSession() {
    var sessionName = document.getElementById('sessionName').value;
    var user = document.getElementById('user').value;

    getToken(sessionName).then((token) => {
        var webComponent = document.querySelector('openvidu-webcomponent');
        webComponent.sessionConfig = { sessionName, user, token };
    });
}

/**
 * --------------------------
 * SERVER-SIDE RESPONSIBILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
 *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
 *   3) Configure OpenVidu Web Component in your client side with the token
 */

var OPENVIDU_SERVER_URL = 'https://' + location.hostname + ':4443';

function getToken(sessionName) {
    return createSession(sessionName).then((sessionId) => createToken(sessionId));
}

function createSession(sessionName) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/api/sessions',
            data: JSON.stringify({ customSessionId: sessionName }),
            headers: {
                Authorization: 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
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

function createToken(sessionId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/api/tokens',
            data: JSON.stringify({ session: sessionId }),
            headers: {
                Authorization: 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
                'Content-Type': 'application/json',
            },
            success: (response) => resolve(response.token),
            error: (error) => reject(error),
        });
    });
}
