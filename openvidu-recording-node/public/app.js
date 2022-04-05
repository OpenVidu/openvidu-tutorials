var OV;
var session;

var sessionName;
var token;
var numVideos = 0;


/* OPENVIDU METHODS */

function joinSession() {
	
	// --- 0) Change the button ---
		
	document.getElementById("join-btn").disabled = true;
	document.getElementById("join-btn").innerHTML = "Joining...";

	getToken(function () {

		// --- 1) Get an OpenVidu object ---

		OV = new OpenVidu();

		// --- 2) Init a session ---

		session = OV.initSession();

		// --- 3) Specify the actions when events take place in the session ---

		session.on('connectionCreated', event => {
			pushEvent(event);
		});

		session.on('connectionDestroyed', event => {
			pushEvent(event);
		});

		// On every new Stream received...
		session.on('streamCreated', event => {
			pushEvent(event);

			// Subscribe to the Stream to receive it
			// HTML video will be appended to element with 'video-container' id
			var subscriber = session.subscribe(event.stream, 'video-container');

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementCreated', event => {
				pushEvent(event);
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(1);
			});

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementDestroyed', event => {
				pushEvent(event);
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(-1);
			});

			// When the subscriber stream has started playing media...
			subscriber.on('streamPlaying', event => {
				pushEvent(event);
			});
		});

		session.on('streamDestroyed', event => {
			pushEvent(event);
		});

		session.on('sessionDisconnected', event => {
			pushEvent(event);
			if (event.reason !== 'disconnect') {
				removeUser();
			}
			if (event.reason !== 'sessionClosedByServer') {
				session = null;
				numVideos = 0;
				$('#join').show();
				$('#session').hide();
			}
		});

		session.on('recordingStarted', event => {
			pushEvent(event);
		});

		session.on('recordingStopped', event => {
			pushEvent(event);
		});

		// On every asynchronous exception...
		session.on('exception', (exception) => {
			console.warn(exception);
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
					publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
					publishVideo: true, // Whether you want to start publishing with your video enabled or not
					resolution: '640x480', // The resolution of your video
					frameRate: 30, // The frame rate of your video
					insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
					mirror: false // Whether to mirror your local video or not
				});

				// --- 7) Specify the actions when events take place in our publisher ---

				// When the publisher stream has started playing media...
				publisher.on('accessAllowed', event => {
					pushEvent({
						type: 'accessAllowed'
					});
				});

				publisher.on('accessDenied', event => {
					pushEvent(event);
				});

				publisher.on('accessDialogOpened', event => {
					pushEvent({
						type: 'accessDialogOpened'
					});
				});

				publisher.on('accessDialogClosed', event => {
					pushEvent({
						type: 'accessDialogClosed'
					});
				});

				// When the publisher stream has started playing media...
				publisher.on('streamCreated', event => {
					pushEvent(event);
				});

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', event => {
					pushEvent(event);
					updateNumVideos(1);
					$(event.element).prop('muted', true); // Mute local video
				});

				// When the HTML video has been appended to DOM...
				publisher.on('videoElementDestroyed', event => {
					pushEvent(event);
					// Add a new HTML element for the user's name and nickname over its video
					updateNumVideos(-1);
				});

				// When the publisher stream has started playing media...
				publisher.on('streamPlaying', event => {
					pushEvent(event);
				});

				// --- 8) Publish your stream ---

				session.publish(publisher);

			})
			.catch(error => {
				console.warn('There was an error connecting to the session:', error.code, error.message);
				enableBtn();
			});

		return false;
	});
}

function leaveSession() {

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---
	session.disconnect();
	enableBtn();

}

/* OPENVIDU METHODS */

function enableBtn (){
	document.getElementById("join-btn").disabled = false;
	document.getElementById("join-btn").innerHTML = "Join!";
}

/* APPLICATION REST METHODS */

function getToken(callback) {
	sessionName = $("#sessionName").val(); // Video-call chosen by the user

	httpRequest(
		'POST',
		'recording-node/api/get-token', {
			sessionName: sessionName
		},
		'Request of TOKEN gone WRONG:',
		res => {
			token = res[0]; // Get token from response
			console.warn('Request of TOKEN gone WELL (TOKEN:' + token + ')');
			callback(token); // Continue the join operation
		}
	);
}

function removeUser() {
	httpRequest(
		'POST',
		'recording-node/api/remove-user', {
			sessionName: sessionName,
			token: token
		},
		'User couldn\'t be removed from session',
		res => {
			console.warn("You have been removed from session " + sessionName);
		}
	);
}

function closeSession() {
	httpRequest(
		'DELETE',
		'recording-node/api/close-session', {
			sessionName: sessionName
		},
		'Session couldn\'t be closed',
		res => {
			console.warn("Session " + sessionName + " has been closed");
		}
	);
}

function fetchInfo() {
	httpRequest(
		'POST',
		'recording-node/api/fetch-info', {
			sessionName: sessionName
		},
		'Session couldn\'t be fetched',
		res => {
			console.warn("Session info has been fetched");
			$('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function fetchAll() {
	httpRequest(
		'GET',
		'recording-node/api/fetch-all', {},
		'All session info couldn\'t be fetched',
		res => {
			console.warn("All session info has been fetched");
			$('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function forceDisconnect() {
	httpRequest(
		'DELETE',
		'recording-node/api/force-disconnect', {
			sessionName: sessionName,
			connectionId: document.getElementById('forceValue').value
		},
		'Connection couldn\'t be closed',
		res => {
			console.warn("Connection has been closed");
		}
	);
}

function forceUnpublish() {
	httpRequest(
		'DELETE',
		'recording-node/api/force-unpublish', {
			sessionName: sessionName,
			streamId: document.getElementById('forceValue').value
		},
		'Stream couldn\'t be closed',
		res => {
			console.warn("Stream has been closed");
		}
	);
}

function httpRequest(method, url, body, errorMsg, callback) {
	$('#textarea-http').text('');
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
					callback(e);
				}
			} else {
				console.warn(errorMsg + ' (' + http.status + ')');
				console.warn(http.responseText);
				$('#textarea-http').text(errorMsg + ": HTTP " + http.status + " (" + http.responseText + ")");
			}
		}
	}
}

function startRecording() {
	var outputMode = $('input[name=outputMode]:checked').val();
	var hasAudio = $('#has-audio-checkbox').prop('checked');
	var hasVideo = $('#has-video-checkbox').prop('checked');
	httpRequest(
		'POST',
		'recording-node/api/recording/start', {
			session: session.sessionId,
			outputMode: outputMode,
			hasAudio: hasAudio,
			hasVideo: hasVideo
		},
		'Start recording WRONG',
		res => {
			console.log(res);
			document.getElementById('forceRecordingId').value = res.id;
			checkBtnsRecordings();
			$('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function stopRecording() {
	var forceRecordingId = document.getElementById('forceRecordingId').value;
	httpRequest(
		'POST',
		'recording-node/api/recording/stop', {
			recording: forceRecordingId
		},
		'Stop recording WRONG',
		res => {
			console.log(res);
			$('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function deleteRecording() {
	var forceRecordingId = document.getElementById('forceRecordingId').value;
	httpRequest(
		'DELETE',
		'recording-node/api/recording/delete', {
			recording: forceRecordingId
		},
		'Delete recording WRONG',
		res => {
			console.log("DELETE ok");
			$('#textarea-http').text("DELETE ok");
		}
	);
}

function getRecording() {
	var forceRecordingId = document.getElementById('forceRecordingId').value;
	httpRequest(
		'GET',
		'recording-node/api/recording/get/' + forceRecordingId, {},
		'Get recording WRONG',
		res => {
			console.log(res);
			$('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function listRecordings() {
	httpRequest(
		'GET',
		'recording-node/api/recording/list', {},
		'List recordings WRONG',
		res => {
			console.log(res);
			$('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

/* APPLICATION REST METHODS */



/* APPLICATION BROWSER METHODS */

events = '';

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

function checkBtnsForce() {
	if (document.getElementById("forceValue").value === "") {
		document.getElementById('buttonForceUnpublish').disabled = true;
		document.getElementById('buttonForceDisconnect').disabled = true;
	} else {
		document.getElementById('buttonForceUnpublish').disabled = false;
		document.getElementById('buttonForceDisconnect').disabled = false;
	}
}

function checkBtnsRecordings() {
	if (document.getElementById("forceRecordingId").value === "") {
		document.getElementById('buttonGetRecording').disabled = true;
		document.getElementById('buttonStopRecording').disabled = true;
		document.getElementById('buttonDeleteRecording').disabled = true;
	} else {
		document.getElementById('buttonGetRecording').disabled = false;
		document.getElementById('buttonStopRecording').disabled = false;
		document.getElementById('buttonDeleteRecording').disabled = false;
	}
}

function pushEvent(event) {
	events += (!events ? '' : '\n') + event.type;
	$('#textarea-events').text(events);
}

function clearHttpTextarea() {
	$('#textarea-http').text('');
}

function clearEventsTextarea() {
	$('#textarea-events').text('');
	events = '';
}

/* APPLICATION BROWSER METHODS */