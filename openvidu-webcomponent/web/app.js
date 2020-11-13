$(document).ready(() => {
    var webComponent = document.querySelector('openvidu-webcomponent');
    var form = document.getElementById('main');

    if(webComponent.getAttribute("openvidu-secret") != undefined && webComponent.getAttribute("openvidu-server-url") != undefined ){
        form.style.display = 'none';
        webComponent.style.display = 'block';
    }

    webComponent.addEventListener('sessionCreated', (event) => {
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
            document.body.style.backgroundColor = "white";
            form.style.display = 'block';
            webComponent.style.display = 'none';
        });
    });

    webComponent.addEventListener('publisherCreated', (event) => {
        var publisher = event.detail;

        // You can see the publisher documentation here
        // https://docs.openvidu.io/en/stable/api/openvidu-browser/classes/publisher.html

        publisher?.on('streamCreated', (e) => {
             console.warn("Publisher streamCreated", e);
        });

        publisher?.on('streamPlaying', (e) => {
            console.warn("Publisher streamPlaying", e);
        });

        document.body.style.backgroundColor = "gray";
        form.style.display = 'none';
        webComponent.style.display = 'block';
    });


    webComponent.addEventListener('error', (event) => {
        console.log('Error event', event.detail);
    });
});

async function joinSession() {
    var sessionName = document.getElementById('sessionName').value;
    var user = document.getElementById('user').value;
    var webComponent = document.querySelector('openvidu-webcomponent');
    var tokens = [];

    if(webComponent.getAttribute("openvidu-secret") != undefined && webComponent.getAttribute("openvidu-server-url") != undefined ){
       location.reload();
    }else {
        var token1 = await getToken(sessionName)
        var token2 = await getToken(sessionName);
        tokens.push(token1, token2);
        webComponent.sessionConfig = { sessionName, user, tokens };
    }
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

var OPENVIDU_SERVER_URL = "https://demos.openvidu.io";
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
