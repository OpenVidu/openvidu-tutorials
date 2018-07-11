$(document).ready(() => {
    var ov = document.querySelector('openvidu-webcomponent');

    ov.addEventListener('joinSession', (event) => {
        document.getElementById('main').style.display = 'none';
        document.getElementById('session').style.display = 'block';
    });

    ov.addEventListener('leaveSession', (event) => {
        document.getElementById('main').style.display = 'block';
        document.getElementById('session').style.display = 'none';
    });

    ov.addEventListener('error', (event) => {
        console.log('Error event', event.detail);
    });
});

function joinSession() {
    var ov = document.querySelector('openvidu-webcomponent');
    var sessionId = document.getElementById('sessionId').value;
    var user = document.getElementById('user').value;

    getToken(sessionId).then((token) => {
        ov.sessionConfig = { sessionId, user, token };
    });
}

/**
 * --------------------------
 * SERVER-SIDE RESPONSABILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
 *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
 *   3) The token must be consumed in Session.connect() method
 */

var OPENVIDU_SERVER_URL = 'https://' + location.hostname + ':4443';

function getToken(mySessionId) {
    return createSession(mySessionId).then((sessionId) => createToken(sessionId));
}

function createSession(sessionId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/api/sessions',
            data: JSON.stringify({ customSessionId: sessionId }),
            headers: {
                Authorization: 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
                'Content-Type': 'application/json',
            },
            success: (response) => resolve(response.id),
            error: (error) => {
                if (error.status === 409) {
                    resolve(sessionId);
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
