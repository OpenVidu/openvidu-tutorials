// OpenVidu global variables
var OVCamera;
var OVScreen
var sessionCamera;
var sessionScreen

// User name and session name global variables
var myUserName;
var mySessionId;
var screensharing = false;


/* OPENVIDU METHODS */

function joinSession() {

	mySessionId = document.getElementById("sessionId").value;
	myUserName = document.getElementById("userName").value;

	// --- 1) Create two OpenVidu objects.

	// 'OVCamera' will handle Camera operations.
	// 'OVScreen' will handle screen sharing operations
	OVCamera = new OpenVidu();
	OVScreen = new OpenVidu();

	// --- 2) Init two OpenVidu Session Objects ---

	// 'sessionCamera' will handle camera operations
	// 'sessionScreen' will handle screen sharing operations
	sessionCamera = OVCamera.initSession();
	sessionScreen = OVScreen.initSession();

	// --- 3) Specify the actions when events of type 'streamCreated' take
	// --- place in the session. The reason why we're using two different objects
	// --- is to handle diferently the subscribers when it is of 'CAMERA' type, or 'SCREEN' type ---

	// ------- 3.1) Handle subscribers of 'CAMERA' type
	sessionCamera.on('streamCreated', event => {
		if (event.stream.typeOfVideo == "CAMERA") {
			// Subscribe to the Stream to receive it. HTML video will be appended to element with 'container-cameras' id
			var subscriber = sessionCamera.subscribe(event.stream, 'container-cameras');
			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementCreated', event => {
				// Add a new <p> element for the user's nickname just below its video
				appendUserData(event.element, subscriber.stream.connection);
			});
		}
	});

	// ------- 3.2) Handle subscribers of 'Screen' type
	sessionScreen.on('streamCreated', event => {
		if (event.stream.typeOfVideo == "SCREEN") {
			// Subscribe to the Stream to receive it. HTML video will be appended to element with 'container-screens' id
			var subscriberScreen = sessionScreen.subscribe(event.stream, 'container-screens');
			// When the HTML video has been appended to DOM...
			subscriberScreen.on('videoElementCreated', event => {
				// Add a new <p> element for the user's nickname just below its video
				appendUserData(event.element, subscriberScreen.stream.connection);
			});
		}
	});

	// On every Stream destroyed...
	sessionCamera.on('streamDestroyed', event => {
		// Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
		removeUserData(event.stream.connection);
	});

	// On every asynchronous exception...
	sessionCamera.on('exception', (exception) => {
		console.warn(exception);
	});


	// --- 4) Connect to the session with two different tokens: one for the camera and other for the screen ---

	// --- 4.1) Get the token for the 'sessionCamera' object
	getToken(mySessionId).then(token => {

		// First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
		// 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
		sessionCamera.connect(token, { clientData: myUserName })
			.then(() => {

				// --- 5) Set page layout for active call ---

				document.getElementById('session-title').innerText = mySessionId;
				document.getElementById('join').style.display = 'none';
				document.getElementById('session').style.display = 'block';

				// --- 6) Get your own camera stream with the desired properties ---

				var publisher = OVCamera.initPublisher('container-cameras', {
					audioSource: undefined, // The source of audio. If undefined default microphone
					videoSource: undefined, // The source of video. If undefined default webcam
					publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
					publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
					resolution: '640x480',  // The resolution of your video
					frameRate: 30,			// The frame rate of your video
					insertMode: 'APPEND',	// How the video is inserted in the target element 'container-cameras'
					mirror: false       	// Whether to mirror your local video or not
				});

				// --- 7) Specify the actions when events take place in our publisher ---

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', function (event) {
					initMainVideo(event.element, myUserName);
					appendUserData(event.element, myUserName);
					event.element['muted'] = true;
				});

				// --- 8) Publish your stream ---
				sessionCamera.publish(publisher);

			})
			.catch(error => {
				console.log('There was an error connecting to the session:', error.code, error.message);
			});
	});

	// --- 4.2) Get the token for the 'sessionScreen' object
	getToken(mySessionId).then((tokenScreen) => {
		// Create a token for screen share
		sessionScreen.connect(tokenScreen, { clientData: myUserName }).then(() => {
			document.getElementById('buttonScreenShare').style.visibility = 'visible';
			console.log("Session screen connected");
		}).catch((error => {
			console.warn('There was an error connecting to the session for screen share:', error.code, error.message);
		}));;
	});
}

// --- 9) Function to be called when the 'Screen share' button is clicked
function publishScreenShare() {
	// --- 9.1) To create a publisherScreen set the property 'videoSource' to 'screen'
	var publisherScreen = OVScreen.initPublisher("container-screens", { videoSource: "screen" });

	// --- 9.2) Publish the screen share stream only after the user grants permission to the browser
	publisherScreen.once('accessAllowed', (event) => {
		document.getElementById('buttonScreenShare').style.visibility = 'hidden';
		screensharing = true;
		// If the user closes the shared window or stops sharing it, unpublish the stream
		publisherScreen.stream.getMediaStream().getVideoTracks()[0].addEventListener('ended', () => {
			console.log('User pressed the "Stop sharing" button');
			sessionScreen.unpublish(publisherScreen);
			document.getElementById('buttonScreenShare').style.visibility = 'visible';
			screensharing = false;
		});
		sessionScreen.publish(publisherScreen);
	});

	publisherScreen.on('videoElementCreated', function (event) {
		appendUserData(event.element, sessionScreen.connection);
		event.element['muted'] = true;
	});

	publisherScreen.once('accessDenied', (event) => {
		console.error('Screen Share: Access Denied');
	});
}

function leaveSession() {

	// --- 10) Leave the session by calling 'disconnect' method over the Session object ---
	sessionScreen.disconnect();
	sessionCamera.disconnect();

	// Removing all HTML elements with user's nicknames.
	// HTML videos are automatically removed when leaving a Session
	removeAllUserData();

	// Back to 'Join session' page
	document.getElementById('join').style.display = 'block';
	document.getElementById('session').style.display = 'none';
	// Restore default screensharing value to false
	screensharing = false;
}

window.onbeforeunload = function () {
	if (sessionCamera) sessionCamera.disconnect();
	if (sessionScreen) sessionScreen.disconnect();
};

/* APPLICATION SPECIFIC METHODS */

window.addEventListener('load', function () {
	generateParticipantInfo();
});

function generateParticipantInfo() {
	document.getElementById("sessionId").value = "SessionScreenA";
	document.getElementById("userName").value = "Participant" + Math.floor(Math.random() * 100);
}

function appendUserData(videoElement, connection) {
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
	dataNode.innerHTML = "<p>" + userData + "</p>";
	videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
	addClickListener(videoElement, userData);
}

function removeUserData(connection) {
	var dataNodeToRemove = document.getElementById("data-" + connection.connectionId);
	if (dataNodeToRemove) {
		dataNodeToRemove.parentNode.removeChild(dataNodeToRemove);
	}
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

function initMainVideo(videoElement, userData) {
	document.querySelector('#main-video video').srcObject = videoElement.srcObject;
	document.querySelector('#main-video p').innerHTML = userData;
	document.querySelector('#main-video video')['muted'] = true;
}


/**
 * --------------------------------------------
 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
 * --------------------------------------------
 * The methods below request the creation of a Session and a Token to
 * your application server. This keeps your OpenVidu deployment secure.
 * 
 * In this sample code, there is no user control at all. Anybody could
 * access your application server endpoints! In a real production
 * environment, your application server must identify the user to allow
 * access to the endpoints.
 * 
 * Visit https://docs.openvidu.io/en/stable/application-server to learn
 * more about the integration of OpenVidu in your application server.
 */

 var APPLICATION_SERVER_URL = "http://localhost:5000/";

 function getToken(mySessionId) {
	 return createSession(mySessionId).then(sessionId => createToken(sessionId));
 }
 
 function createSession(sessionId) {
	 return new Promise((resolve, reject) => {
		 $.ajax({
			 type: "POST",
			 url: APPLICATION_SERVER_URL + "api/sessions",
			 data: JSON.stringify({ customSessionId: sessionId }),
			 headers: { "Content-Type": "application/json" },
			 success: response => resolve(response), // The sessionId
			 error: (error) => reject(error)
		 });
	 });
 }
 
 function createToken(sessionId) {
	 return new Promise((resolve, reject) => {
		 $.ajax({
			 type: 'POST',
			 url: APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
			 data: JSON.stringify({}),
			 headers: { "Content-Type": "application/json" },
			 success: (response) => resolve(response), // The token
			 error: (error) => reject(error)
		 });
	 });
 }