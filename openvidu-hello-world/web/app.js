/* OPENVIDU METHODS */

var OV;
var session;

function joinSession() {

	var sessionId = document.getElementById("sessionId").value;
	var userName = document.getElementById("userName").value;

	// --- 1) Get an OpenVidu object and init a session with a sessionId ---

	// Init OpenVidu object
	OV = new OpenVidu();
	
	// We will join the video-call "sessionId". As there's no server, this parameter must start with the URL of 
	// OpenVidu Server (with secure websocket protocol: "wss://") and must include the OpenVidu secret at the end
	session = OV.initSession("wss://" + location.hostname + ":8443/" + sessionId + '?secret=MY_SECRET');


	// --- 2) Specify the actions when events take place ---

	// On every new Stream received...
	session.on('streamCreated', function (event) {

		// Subscribe to the Stream to receive it. A video will be appended to element with id 'subscriber'
		var subscriber = session.subscribe(event.stream, 'subscriber');

		// When the video has been appended to DOM...
		subscriber.on('videoElementCreated', function (event) {
			// Add a new HTML element for the user's nickname
			appendUserData(event.element, subscriber.stream.connection);
		});
	});

	// On every Stream destroyed...
	session.on('streamDestroyed', function (event) {
		// Delete the HTML element with the user's nickname
		removeUserData(event.stream.connection);
	});


	// --- 3) Connect to the session ---

	// First param irrelevant if your app has no server-side. Second param will be received by every user
	// in Stream.connection.data property, which will be appended to DOM as the user's nickname
	session.connect(null, '{"clientData": "' + userName + '"}', function (error) {

		// If the connection is successful, initialize a publisher and publish to the session
		if (!error) {

			// --- 4) Get your own camera stream with the desired resolution ---

			// Your video will be appended to element with id 'publisher'
			var publisher = OV.initPublisher('publisher', {
				audio: true,
				video: true,
				quality: 'MEDIUM'
			});

			// --- 5) Publish your stream ---

			session.publish(publisher);

		} else {
			console.log('There was an error connecting to the session:', error.code, error.message);
		}
	});

	// Show Session page
	document.getElementById('session-header').innerText = sessionId;
	document.getElementById('join').style.display = 'none';
	document.getElementById('session').style.display = 'block';

	return false;
}


function leaveSession() {

	// --- 6) Leave the session by calling 'disconnect' method over the Session object ---

	session.disconnect();

	// Removing all HTML elements with the user's nicknames
	removeAllUserData();

	// Show Join Session page
	document.getElementById('join').style.display = 'block';
	document.getElementById('session').style.display = 'none';
}

/* OPENVIDU METHODS */



/* APPLICATION SPECIFIC METHODS */

window.addEventListener('load', function () {
	generateParticipantInfo();
});

window.onbeforeunload = function () {
	session.disconnect()
};

function generateParticipantInfo() {
	document.getElementById("sessionId").value = "SessionA";
	document.getElementById("userName").value = "Participant" + Math.floor(Math.random() * 100);
}

function appendUserData(videoElement, connection) {
	var clientDataJSON = JSON.parse(connection.data);
	var dataNode = document.createElement('p');
	dataNode.className = "data-node";
	dataNode.id = "data-" + connection.connectionId;
	dataNode.innerHTML = clientDataJSON.clientData;
	videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
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

/* APPLICATION SPECIFIC METHODS */