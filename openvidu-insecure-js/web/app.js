var OV;
var session;
var sessionId;


/* OPENVIDU METHODS */

function joinSession() {

	sessionId = document.getElementById("sessionId").value;
	var userName = document.getElementById("userName").value;

	// --- 1) Get an OpenVidu object and init a session ---

	OV = new OpenVidu();
	session = OV.initSession();


	// --- 2) Specify the actions when events take place ---

	// On every new Stream received...
	session.on('streamCreated', function (event) {

		// Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
		var subscriber = session.subscribe(event.stream, 'video-container');

		// When the HTML video has been appended to DOM...
		subscriber.on('videoElementCreated', function (event) {

			// Add a new <p> element for the user's nickname just below its video
			appendUserData(event.element, subscriber.stream.connection);
		});
	});

	// On every Stream destroyed...
	session.on('streamDestroyed', function (event) {

		// Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
		removeUserData(event.stream.connection);
	});


	// --- 3) Connect to the session with a valid user token ---

	// 'getToken' method is simulating what your server-side should do.
	// 'token' parameter should be retrieved and returned by your own backend
	getToken().then(token => {

		// First param is the token retrieved from OpenVidu Server. Second param will be received by every user
		// in Stream.connection.data property, which will be appended to DOM as the user's nickname
		session.connect(token, '{"clientData": "' + userName + '"}')
			.then(() => {

				// --- 4) Get your own camera stream with the desired properties ---

				var publisher = OV.initPublisher('video-container', {
					audioSource: undefined, // The source of audio. If undefined default audio input
					videoSource: undefined, // The source of video. If undefined default video input
					publishAudio: true,  	// Whether you want to start the publishing with your audio unmuted or muted
					publishVideo: true,  	// Whether you want to start the publishing with your video enabled or disabled
					resolution: '640x480',  // The resolution of your video
					frameRate: 30,			// The frame rate of your video
					insertMode: 'APPEND',	// How the video will be inserted in the target element 'video-container'	
					mirror: false       	// Whether to mirror your local video or not
				});

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', function (event) {
					initMainVideo(event.element, userName);
					appendUserData(event.element, userName);
					event.element['muted'] = true;
				});

				// --- 5) Publish your stream ---

				session.publish(publisher);
			})
			.catch(error => {
				console.log('There was an error connecting to the session:', error.code, error.message);
			});

		document.getElementById('session-title').innerText = sessionId;
		document.getElementById('join').style.display = 'none';
		document.getElementById('session').style.display = 'block';
	});
}

function leaveSession() {

	// --- 6) Leave the session by calling 'disconnect' method over the Session object ---

	session.disconnect();

	// Removing all HTML elements with the user's nicknames. 
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
	if (session) session.disconnect();
};

function generateParticipantInfo() {
	document.getElementById("sessionId").value = "SessionA";
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
		var mainVideo = document.querySelector('#main-video video');
		var mainUserData = document.querySelector('#main-video p');
		if (mainVideo.srcObject !== videoElement.srcObject) {
			mainUserData.innerHTML = userData;
			mainVideo.srcObject = videoElement.srcObject;
		}
	});
}

function initMainVideo(videoElement, userData) {
	document.querySelector('#main-video video').srcObject = videoElement.srcObject;
	document.querySelector('#main-video p').innerHTML = userData;
	document.querySelector('#main-video video')['muted'] = true;
}



/**
 * --------------------------
 * SERVER-SIDE RESPONSABILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) POST /api/sessions
 *   2) POST /api/tokens
 *   3) The value returned by /api/tokens must be consumed in Session.connect() method
 */

function getToken() {
	return new Promise(async function (resolve) {
		// POST /api/sessions
		await apiSessions();
		// POST /api/tokens
		let t = await apiTokens();
		// Return the user token
		resolve(t);
	});
}

function apiSessions() {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: "https://" + location.hostname + ":4443/api/sessions",
			data: JSON.stringify({ customSessionId: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: (response) => {
				resolve(response.id)
			},
			error: (error) => {
				if (error.status === 409) {
					resolve(sessionId);
				} else {
					reject(error)
				}
			}
		});
	});
}

function apiTokens() {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: "https://" + location.hostname + ":4443/api/tokens",
			data: JSON.stringify({ session: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: (response) => {
				resolve(response.id)
			},
			error: (error) => { reject(error) }
		});
	});
}