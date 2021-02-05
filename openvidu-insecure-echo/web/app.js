var OV1, OV2;
var session1, session2;

var isSubscribingToSession = false;
var isSubscribedToSession = false;

/* OPENVIDU METHODS */

function joinSessionAs(role) {

	var mySessionId = document.getElementById("sessionId").value;
	var myUserName = document.getElementById("userName").value;

  if (role == 'PUBLISHER') {
    // --- 1) Get an OpenVidu object ---

    OV1 = new OpenVidu();

    // --- 2) Init a session ---

    session1 = OV1.initSession();

    // --- 3) Specify the actions when events take place in the session ---

    // On every new Stream received...
    session1.on('streamCreated', event => {

      // Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
      var subscriber = session1.subscribe(event.stream, 'video-container');

      // When the HTML video has been appended to DOM...
      subscriber.on('videoElementCreated', event => {

        // Add a new <p> element for the user's nickname just below its video
        appendUserData(event.element, subscriber.stream.connection, role);
      });
    });

    // On every Stream destroyed...
    session1.on('streamDestroyed', event => {

      // Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
      removeUserData(event.stream.connection);
    });


    // --- 4) Connect to the session with a valid user token ---

    // 'getToken' method is simulating what your server-side should do.
    // 'token' parameter should be retrieved and returned by your own backend
    getToken(mySessionId, role).then(token => {

      // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
      // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
      session1.connect(token, { clientData: myUserName })
        .then(() => {

          // --- 5) Set page layout for active call ---

          document.getElementById('session-title').innerText = mySessionId;
          document.getElementById('join').style.display = 'none';
          document.getElementById('session').style.display = 'block';

          // --- 6) Get your own camera stream with the desired properties ---

          var publisher = OV1.initPublisher('video-container', {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
            publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
            resolution: '640x480',  // The resolution of your video
            frameRate: 30,			// The frame rate of your video
            insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'	
            mirror: false       	// Whether to mirror your local video or not
          });

          // --- 7) Specify the actions when events take place in our publisher ---

          // When our HTML video has been added to DOM...
          publisher.on('videoElementCreated', function (event) {
            initMainVideo(event.element, myUserName, role);
            appendUserData(event.element, myUserName, role);
            event.element['muted'] = true;
          });

          // --- 8) Publish your stream ---

          session1.publish(publisher);

        })
        .catch(error => {
          console.log('There was an error connecting to the session:', error.code, error.message);
        });
    });
  } else if (role == 'SUBSCRIBER') {

    if (isSubscribingToSession) {
      alert('You are already trying to subscribe to the session, please wait!');
      return;
    }

    if (isSubscribedToSession) {
      alert('You already subscribed to the session!');
      return;
    }

    isSubscribingToSession = true;

    OV2 = new OpenVidu();

    // --- 2) Init a session ---

    session2 = OV2.initSession();

    // --- 3) Specify the actions when events take place in the session ---

    // On every new Stream received...
    session2.on('streamCreated', event => {

      // Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
      var subscriber = session2.subscribe(event.stream, 'video-container');

      // When the HTML video has been appended to DOM...
      subscriber.on('videoElementCreated', event => {

        // Add a new <p> element for the user's nickname just below its video
        appendUserData(event.element, subscriber.stream.connection, role);
      });
    });

    // On every Stream destroyed...
    session2.on('streamDestroyed', event => {

      // Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
      removeUserData(event.stream.connection);
    });


    // --- 4) Connect to the session with a valid user token ---

    // 'getToken' method is simulating what your server-side should do.
    // 'token' parameter should be retrieved and returned by your own backend
    getToken(mySessionId, role).then(token => {

      // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
      // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
      session2.connect(token, { clientData: myUserName + ' (ECHO)' })
        .then(() => {
          isSubscribedToSession = true;
          isSubscribingToSession = false;
        })
        .catch(error => {
          console.log('There was an error connecting to the session:', error.code, error.message);
          isSubscribedToSession = false;
          isSubscribingToSession = false;
        });
    });
  }
}

function leaveSession() {

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---

	session1.disconnect();
  session2.disconnect();

  isSubscribingToSession = false;
  isSubscribedToSession = false;

	// Removing all HTML elements with user's nicknames. 
	// HTML videos are automatically removed when leaving a Session
	removeAllUserData();

	// Back to 'Join session' page
	document.getElementById('join').style.display = 'block';
	document.getElementById('session').style.display = 'none';
}



/* APPLICATION SPECIFIC METHODS */

window.addEventListener('load', function () {
	generateParticipantInfo();
});

window.onbeforeunload = function () {
  if (session1) session1.disconnect();
  if (session2) session2.disconnect();
};

function generateParticipantInfo() {
	document.getElementById("sessionId").value = "SessionA";
	document.getElementById("userName").value = "Participant" + Math.floor(Math.random() * 100);
}

function appendUserData(videoElement, connection, role) {
	var userData;
	var nodeId;
	if (typeof connection === "string") {
		userData = connection;
		nodeId = connection;
	} else {
		userData = JSON.parse(connection.data).clientData;
		nodeId = connection.connectionId;
	}
	var dataNode = document.createElement('div');
	dataNode.className = "data-node";
  dataNode.id = "data-" + nodeId;

  if (role == 'SUBSCRIBER') {
    userData += " (ECHO)";
  }

  dataNode.innerHTML = "<p>" + userData + "</p>";

	videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
	addClickListener(videoElement, userData);
}

function removeUserData(connection) {
	var dataNode = document.getElementById("data-" + connection.connectionId);
	dataNode.parentNode.removeChild(dataNode);
}

function removeAllUserData() {
	var nicknameElements = document.getElementsByClassName('data-node');
	while (nicknameElements[0]) {
		nicknameElements[0].parentNode.removeChild(nicknameElements[0]);
	}
}

function addClickListener(videoElement, userData) {
	videoElement.addEventListener('click', function () {
		var mainVideo = $('#main-video video').get(0);
		if (mainVideo.srcObject !== videoElement.srcObject) {
			$('#main-video').fadeOut("fast", () => {
				$('#main-video p').html(userData);
				mainVideo.srcObject = videoElement.srcObject;
				$('#main-video').fadeIn("fast");
			});
		}
	});
}

function initMainVideo(videoElement, userData, role) {
  document.querySelector('#main-video video').srcObject = videoElement.srcObject;
  if (role == 'SUBSCRIBER') {
    userData += " (ECHO)";
  }
  document.querySelector('#main-video p').innerHTML = userData;
	document.querySelector('#main-video video')['muted'] = true;
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
 *   3) The token must be consumed in Session.connect() method
 */

//var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
//var OPENVIDU_SERVER_SECRET = "MY_SECRET";

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";

function getToken(mySessionId, role) {
	return createSession(mySessionId).then(sessionId => createToken(sessionId, role));
}

function createSession(sessionId) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-apisessions
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: OPENVIDU_SERVER_URL + "/api/sessions",
			data: JSON.stringify({ customSessionId: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.id),
			error: (error) => {
				if (error.status === 409) {
					resolve(sessionId);
				} else {
					console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + OPENVIDU_SERVER_URL);
					if (window.confirm('No connection to OpenVidu Server. This may be a certificate error at \"' + OPENVIDU_SERVER_URL + '\"\n\nClick OK to navigate and accept it. ' +
						'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' + OPENVIDU_SERVER_URL + '"')) {
						location.assign(OPENVIDU_SERVER_URL + '/accept-certificate');
					}
				}
			}
		});
	});
}

function createToken(sessionId, role) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-apitokens
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: OPENVIDU_SERVER_URL + "/api/tokens",
			data: JSON.stringify({ session: sessionId, role: role }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.token),
			error: error => reject(error)
		});
	});
}