var OV;
var session;


/* APPLICATION SPECIFIC METHODS */

window.addEventListener('load', function () {
	generateParticipantInfo();
});

window.onbeforeunload = function () {
	session.disconnect()
};

function generateParticipantInfo() {
	document.getElementById("sessionId").value = "SessionA";
	document.getElementById("participantId").value = "Participant" + Math.floor(Math.random() * 100);
}

function appendUserData(videoElement, connection) {
	var clientDataJSON = JSON.parse(connection.data);
	var dataNode = document.createElement('p');
	dataNode.className = "data-node";
	dataNode.id = "data-" + connection.connectionId;
	dataNode.innerHTML = "Nickname: " + clientDataJSON.clientData;
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



/* OPENVIDU METHODS */

function joinSession() {

	var sessionId = document.getElementById("sessionId").value;
	var token = document.getElementById("participantId").value;

	// 1) Get an OpenVidu object and init a session with a sessionId

	OV = new OpenVidu("wss://" + location.hostname + ":8443/");
	session = OV.initSession("apikey", sessionId);


	// 2) Specify the actions when events take place

	session.on('streamCreated', function (event) {
		// Subscribe to the stream to receive it
		var subscriber = session.subscribe(event.stream, 'subscriber');
		subscriber.on('videoElementCreated', function (event) {
			// Add a new HTML element for the user's nickname
			appendUserData(event.element, subscriber.stream.connection);
		});
	});

	session.on('streamDestroyed', function (event) {
		// Delete the HTML element with the user's nickname
		removeUserData(event.stream.connection);
	});


	// 3) Connect to the session

	session.connect(token, '{"clientData": "' + token + '"}', function (error) {
		// If the connection is successful, initialize a publisher and publish to the session
		if (!error) {

			// 4) Get your own camera stream with the desired resolution and publish it, if the user is supposed to do so

			var publisher = OV.initPublisher('publisher', {
				audio: true,
				video: true,
				quality: 'MEDIUM'
			});

			// 5) Publish your stream

			session.publish(publisher);

		} else {
			console.log('There was an error connecting to the session:', error.code, error.message);
		}
	});

	document.getElementById('session-header').innerText = sessionId;
	document.getElementById('join').style.display = 'none';
	document.getElementById('session').style.display = 'block';

	return false;
}

function leaveSession() {

	// 6) Leave the session by calling 'disconnect' method over the Session object

	session.disconnect();

	// Removing all HTML elements with the user's nicknames
	removeAllUserData();

	document.getElementById('join').style.display = 'block';
	document.getElementById('session').style.display = 'none';
}

/* OPENVIDU METHODS */