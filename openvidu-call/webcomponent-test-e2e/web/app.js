$(document).ready(() => {
    var webComponent = document.querySelector('openvidu-webcomponent');

    webComponent.addEventListener('sessionCreated', (event) => {
        var session = event.detail;
        appendElement('sessionCreated');


        // You can see the session documentation here
        // https://docs.openvidu.io/en/stable/api/openvidu-browser/classes/session.html

        session.on('connectionCreated', (e) => {
            console.error("connectionCreated", e);
            var user = JSON.parse(e.connection.data).clientData;
            appendElement(user + '-connectionCreated');
        });

        session.on('streamDestroyed', (e) => {
            console.log("streamDestroyed", e);
            var user = JSON.parse(e.stream.connection.data).clientData;
            appendElement(user + '-streamDestroyed');
        });

        session.on('streamCreated', (e) => {
            console.log("streamCreated", e);
            var user = JSON.parse(e.stream.connection.data).clientData;
            appendElement(user + '-streamCreated');
        });

        session.on('sessionDisconnected', (e) => {
            console.warn("sessionDisconnected ", e);
            var user = JSON.parse(e.target.connection.data).clientData;
            appendElement(user + '-sessionDisconnected');
        });
    });

    webComponent.addEventListener('publisherCreated', (event) => {
        var publisher = event.detail;
        appendElement('publisherCreated')

        // You can see the publisher documentation here
        // https://docs.openvidu.io/en/stable/api/openvidu-browser/classes/publisher.html

        publisher.on('streamCreated', (e) => {
            console.warn("Publisher streamCreated", e);
            appendElement('publisher-streamCreated');
        });

        publisher.on('streamPlaying', (e) => {
            appendElement('publisher-streamPlaying');

        });
    });


    webComponent.addEventListener('error', (event) => {
        console.log('Error event', event.detail);
    });

    var user = 'user' + Math.floor(Math.random() * 100);
    joinSession('webcomponentTestE2ESession', user);
});


function appendElement(id) {
    var eventsDiv = document.getElementById('events');
    var element = document.createElement('div');
    element.setAttribute("id", id);
    element.setAttribute("style", "height: 200px;");
    eventsDiv.appendChild(element);
}

async function joinSession(sessionName, user) {
    var webComponent = document.querySelector('openvidu-webcomponent');
    var tokens = [];
    var token1 = await getToken(sessionName)
    var token2 = await getToken(sessionName);
    tokens.push(token1, token2);
    var ovSettings = {
        chat: true,
        autopublish: true,
        toolbarButtons: {
          audio: true,
          video: true,
          screenShare: false,
          fullscreen: true,
          layoutSpeaking: true,
          exit: true,
        }
    };
    webComponent.sessionConfig = { sessionName, user, tokens, ovSettings };
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

var OPENVIDU_SERVER_URL = "https://localhost:4443" ;
var OPENVIDU_SERVER_SECRET = 'MY_SECRET';

function getToken(sessionName) {
    return createSession(sessionName).then((sessionId) => createToken(sessionId));
}

function createSession(sessionName) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-apisessions
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/api/sessions',
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

function createToken(sessionId) {
    // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-apitokens
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/api/tokens',
            data: JSON.stringify({ session: sessionId }),
            headers: {
                Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                'Content-Type': 'application/json',
            },
            success: (response) => resolve(response.token),
            error: (error) => reject(error),
        });
    });
}
