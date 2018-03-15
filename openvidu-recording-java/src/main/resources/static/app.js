var OV;
var session;

var sessionId;
var token;
var sessionName;
var numVideos = 0;


/* OPENVIDU METHODS */

function joinSession() {
	getSessionIdAndToken(function () {

		// --- 1) Get an OpenVidu object and init a session with the retrieved sessionId ---

		OV = new OpenVidu();
		session = OV.initSession(sessionId);


		// --- 2) Specify the actions when events take place ---

		// On every new Stream received...
		session.on('streamCreated', function (event) {

			// Subscribe to the Stream to receive it
			// HTML video will be appended to element with 'video-container' id
			var subscriber = session.subscribe(event.stream, 'video-container');

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementCreated', function (event) {
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(1);
			});

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementDestroyed', function (event) {
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(-1);
			});
		});

		// --- 3) Connect to the session passing the retrieved token ---

		session.connect(token, null, function (error) {

			// If the connection is successful, initialize a publisher and publish to the session
			if (!error) {

				// --- 4) Get your own camera stream ---

				var publisher = OV.initPublisher('video-container', {
					audio: true, // Whether you want to transmit audio or not
					video: true, // Whether you want to transmit video or not
					audioActive: true, // Whether you want to start the publishing with your audio unmuted or muted
					videoActive: true, // Whether you want to start the publishing with your video enabled or disabled
					quality: 'MEDIUM', // The quality of your video ('LOW', 'MEDIUM', 'HIGH')
					screen: false // true to get your screen as video source instead of your camera
				});

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', function (event) {
					updateNumVideos(1);
					$(event.element).prop('muted', true); // Mute local video
				});

				// When the HTML video has been appended to DOM...
				publisher.on('videoElementDestroyed', function (event) {
					// Add a new HTML element for the user's name and nickname over its video
					updateNumVideos(-1);
				});


				// --- 5) Publish your stream ---

				session.publish(publisher);

			} else {
				console.warn('There was an error connecting to the session:', error.code, error.message);
			}
		});

		$('#session-title').text(sessionName);
		$('#join').hide();
		$('#session').show();

		return false;
	});
}

function leaveSession() {

	// 6) Leave the session by calling 'disconnect' method over the Session object

	session.disconnect();
	session = null;
	numVideos = 0;
	
	$('#join').show();
	$('#session').hide();
}

/* OPENVIDU METHODS */



/* APPLICATION REST METHODS */

function getSessionIdAndToken(callback) {
	sessionName = $("#sessionName").val(); // Video-call chosen by the user

	var jsonBody = JSON.stringify({ // Body of POST request
		'session': sessionName
	});

	// Send POST request
	httpRequest('POST', 'api/get-sessionid-token', jsonBody, 'Request of SESSIONID and TOKEN gone WRONG:', function successCallback(response) {
		sessionId = response[0]; // Get sessionId from response
		token = response[1]; // Get token from response
		console.warn('Request of SESSIONID and TOKEN gone WELL (SESSIONID:' + sessionId + ", TOKEN:" + token + ")");
		callback(); // Continue the join operation
	});
}

function removeUser() {
	// Body of POST request with the name of the session and the token of the leaving user
	var jsonBody = JSON.stringify({
		'sessionName': sessionName,
		'token': token
	});

	// Send POST request
	httpRequest('POST', 'api/remove-user', jsonBody, 'User couldn\'t be removed from session', function successCallback(response) {
		console.warn("User correctly removed from session");
	});
}

function httpRequest(method, url, body, errorMsg, callback) {
	$('#text-area').text('');
	var http = new XMLHttpRequest();
	http.open(method, url, true);
	http.setRequestHeader('Content-type', 'application/json');
	http.addEventListener('readystatechange', processRequest, false);
	http.send(body);

	function processRequest() {
		if (http.readyState == 4) {
			if (http.status == 200) {
				try {
					callback(JSON.parse(http.responseText));
				} catch (e) {
					callback();
				}
			} else {
				console.warn(errorMsg + ' (' + http.status + ')');
				console.warn(http.responseText);
				$('#text-area').text(errorMsg + ": HTTP " + http.status + " (" + http.responseText + ")");
			}
		}
	}
}

var recordingId;

function startRecording() {
	var jsonBody = JSON.stringify({
		'session': session.sessionId
	});
	httpRequest('POST', 'api/recording/start', jsonBody, 'Start recording WRONG', function successCallback(response) {
		console.log(response);
		recordingId = response.id;
		$('#text-area').text(JSON.stringify(response, null, "\t"));
	});
}

function stopRecording() {
	var jsonBody = JSON.stringify({
		'recording': recordingId
	});
	httpRequest('POST', 'api/recording/stop', jsonBody, 'Stop recording WRONG', function successCallback(response) {
		console.log(response);
		$('#text-area').text(JSON.stringify(response, null, "\t"));
	});
}

function deleteRecording() {
	var jsonBody = JSON.stringify({
		'recording': recordingId
	});
	httpRequest('DELETE', 'api/recording/delete', jsonBody, 'Delete recording WRONG', function successCallback() {
		console.log("DELETE ok");
		$('#text-area').text("DELETE ok");
	});
}

function getRecording() {
	httpRequest('GET', 'api/recording/get/' + recordingId, '', 'Get recording WRONG', function successCallback(response) {
		console.log(response);
		$('#text-area').text(JSON.stringify(response, null, "\t"));
	});
}

function listRecordings() {
	httpRequest('GET', 'api/recording/list', '', 'List recordings WRONG', function successCallback(response) {
		console.log(response);
		$('#text-area').text(JSON.stringify(response, null, "\t"));
	});
}

/* APPLICATION REST METHODS */



/* APPLICATION BROWSER METHODS */

window.onbeforeunload = function () { // Gracefully leave session
	if (session) {
		removeUser();
		leaveSession();
	}
}

function updateNumVideos(i) {
	numVideos += i;
	$('video').removeClass();
	switch (numVideos) {
		case 1:
			$('video').addClass('two');
			break;
		case 2:
			$('video').addClass('two');
			break;
		case 3:
			$('video').addClass('three');
			break;
		case 4:
			$('video').addClass('four');
			break;
	}
}

/* APPLICATION BROWSER METHODS */