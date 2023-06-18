var OV;
var session;

var sessionId;
var numVideos;


/* OPENVIDU METHODS */

async function joinSession() {
	let token = await getToken();
	await connectToSessionWithToken(token);
}

function leaveSession() {
	session.disconnect();
}

async function connectToSessionWithToken(token) {

	numVideos = 0;

	OV = new OpenVidu();

	session = OV.initSession();

	session.on('connectionCreated', event => {
		pushEvent(event);
	});

	session.on('connectionDestroyed', event => {
		pushEvent(event);
	});

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
		session = null;
		numVideos = 0;
		if (event.reason === 'nodeCrashed') {
			console.warn('Node has crashed!');
			$('#reconnectionModal').modal('show');
			joinSession();
		} else {
			$('#join').show();
			$('#session').hide();
		}
	});

	try {

		await session.connect(token);

		// Set page layout for active call

		$('#session-title').text(sessionId);
		$('#join').hide();
		$('#session').show();
		$('#reconnectionModal').modal('hide');

		// Get your own camera stream

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

		// Specify the actions when events take place in our publisher

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

		// Publish your stream

		session.publish(publisher);

	} catch (error) {
		console.warn('There was an error connecting to the session:', error.code, error.message);
	}
}

/* OPENVIDU METHODS */



/* APPLICATION REST METHODS */

async function getToken() {

	// Check if #join is hidden
	if ($('#join').is(':visible')) {
		sessionId = $("#sessionId").val(); // Video-call chosen by the user
	}
	var mustRetry = true;

	while (mustRetry) {
		try {
			const result = await $.ajax({
				url: 'api/get-token',
				type: 'POST',
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify({ sessionId })
			});
			console.log('Request of TOKEN gone WELL (TOKEN:' + result + ')');
			mustRetry = false;
			return result.token;
		} catch (error) {
			if (error.status === 404) {
				console.warn('The session was closed. Try again');
			} else {
				mustRetry = false;
				console.error('Unexpected error', error);
			}
		}
	}
}

/* APPLICATION REST METHODS */



/* APPLICATION BROWSER METHODS */

events = '';

window.onbeforeunload = function () { // Gracefully leave session
	if (session) {
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
		case 5:
			$('video').addClass('five');
			break;
		case 6:
			$('video').addClass('six');
			break;
	}
}

function pushEvent(event) {
	events += (!events ? '' : '\n') + event.type;
	$('#textarea-events').text(events);
}

function clearEventsTextarea() {
	$('#textarea-events').text('');
	events = '';
}

/* APPLICATION BROWSER METHODS */