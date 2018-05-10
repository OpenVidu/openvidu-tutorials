var OV;
var session;

var sessionName;
var token;
var numVideos = 0;


/* OPENVIDU METHODS */

function joinSession() {
	getToken(function () {

		// --- 1) Get an OpenVidu object ---

		OV = new OpenVidu();

		// --- 2) Init a session ---

		session = OV.initSession();

		// --- 3) Specify the actions when events take place in the session ---

		// On every new Stream received...
		session.on('streamCreated', (event) => {

			// Subscribe to the Stream to receive it
			// HTML video will be appended to element with 'video-container' id
			var subscriber = session.subscribe(event.stream, 'video-container');

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementCreated', (event) => {
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(1);
			});

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementDestroyed', (event) => {
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(-1);
			});
		});

		// --- 4) Connect to the session passing the retrieved token and some more data from
		//        the client (in this case a JSON with the nickname chosen by the user) ---

		session.connect(token)
			.then(() => {

				// --- 5) Set page layout for active call ---

				$('#session-title').text(sessionName);
				$('#join').hide();
				$('#session').show();

				// --- 6) Get your own camera stream ---

				var publisher = OV.initPublisher('video-container', {
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
				publisher.on('videoElementCreated', (event) => {
					updateNumVideos(1);
					$(event.element).prop('muted', true); // Mute local video
				});

				// When the HTML video has been appended to DOM...
				publisher.on('videoElementDestroyed', (event) => {
					// Add a new HTML element for the user's name and nickname over its video
					updateNumVideos(-1);
				});


				// --- 8) Publish your stream ---

				session.publish(publisher);

			})
			.catch(error => {
				console.warn('There was an error connecting to the session:', error.code, error.message);
			});

		return false;
	});
}

function leaveSession() {

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---

	session.disconnect();
	session = null;
	numVideos = 0;
	
	$('#join').show();
	$('#session').hide();
}

/* OPENVIDU METHODS */



/* APPLICATION REST METHODS */

function getToken(callback) {
	sessionName = $("#sessionName").val(); // Video-call chosen by the user

	httpRequest(
		'POST',
		'api/get-token',
		{sessionName: sessionName},
		'Request of TOKEN gone WRONG:',
		(response) => {
			token = response[0]; // Get token from response
			console.warn('Request of TOKEN gone WELL (TOKEN:' + token + ')');
			callback(token); // Continue the join operation
		}
	);
}

function removeUser() {
	httpRequest(
		'POST',
		'api/remove-user',
		{sessionName: sessionName, token: token},
		'User couldn\'t be removed from session', 
		(response) => {
			console.warn("You have been removed from session " + sessionName);
		}
	);
}

function httpRequest(method, url, body, errorMsg, callback) {
	$('#text-area').text('');
	var http = new XMLHttpRequest();
	http.open(method, url, true);
	http.setRequestHeader('Content-type', 'application/json');
	http.addEventListener('readystatechange', processRequest, false);
	http.send(JSON.stringify(body));

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
	httpRequest(
		'POST',
		'api/recording/start',
		{session: session.sessionId},
		'Start recording WRONG', 
		(response) => {
			console.log(response);
			recordingId = response.id;
			$('#text-area').text(JSON.stringify(response, null, "\t"));
		}
	);
}

function stopRecording() {
	httpRequest(
		'POST',
		'api/recording/stop',
		{recording: recordingId},
		'Stop recording WRONG', 
		(response) => {
			console.log(response);
			$('#text-area').text(JSON.stringify(response, null, "\t"));
		}
	);
}

function deleteRecording() {
	httpRequest(
		'DELETE',
		'api/recording/delete',
		{recording: recordingId},
		'Delete recording WRONG',
		() => {
			console.log("DELETE ok");
			$('#text-area').text("DELETE ok");
		}
	);
}

function getRecording() {
	httpRequest(
		'GET',
		'api/recording/get/' + recordingId,
		{},
		'Get recording WRONG',
		(response) => {
			console.log(response);
			$('#text-area').text(JSON.stringify(response, null, "\t"));
		}
	);
}

function listRecordings() {
	httpRequest(
		'GET',
		'api/recording/list',
		{},
		'List recordings WRONG',
		(response) => {
			console.log(response);
			$('#text-area').text(JSON.stringify(response, null, "\t"));
		}
	);
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