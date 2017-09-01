var OV;						// OpenVidu object to initialize a session
var session;				// Session object where the user will connect
var publisher;				// Publisher object which the user will publish
var sessionId;				// Unique identifier of the session
var audioEnabled = true;	// True if the audio track of publisher is active
var videoEnabled = true;	// True if the video track of publisher is active
var numOfVideos = 0;		// Keeps track of the number of videos that are being shown


// Check if the URL already has a room
window.addEventListener('load', function () {
	sessionId = window.location.hash; // For 'https://myurl/#roomId', sessionId would be '#roomId'
	if (sessionId) {
		// The URL has a session id. Join the room right away
		console.log("Joining to room " + sessionId);
		showSessionHideJoin();
		joinRoom(sessionId);
	} else {
		// The URL has not a session id. Show welcome page
		showJoinHideSession();
	}
});

// Disconnect participant on browser's window closed
window.addEventListener('beforeunload', function () {
	session.disconnect();
});


function joinRoom(sessionId) {

	if (!sessionId) {
		// If the user is joining to a new room
		sessionId = '#' + randomString();
	}

	// As insecure OpenVidu, the user's token can be a random string
	var userId = randomString();

	// --- 1) Get an OpenVidu object and init a session with a sessionId ---

	OV = new OpenVidu();

	// We will join the video-call "sessionId". As there's no server, this parameter must start with the URL of 
	// OpenVidu Server (with secure websocket protocol: "wss://") and must include the OpenVidu secret at the end
	session = OV.initSession("wss://" + location.hostname + ":8443/" + sessionId + "?secret=MY_SECRET");


	// --- 2) Specify the actions when events take place ---

	// On every new Stream received...
	session.on('streamCreated', function (event) {
		// Subscribe to the Stream to receive it. HTML video will be appended to element with 'subscriber' id
		var subscriber = session.subscribe(event.stream, 'videos');
		// When the new video is added to DOM, update the page layout to fit one more participant
		subscriber.on('videoElementCreated', function (event) {
			numOfVideos++;
			updateLayout();
		});
	});

	// On every new Stream destroyed...
	session.on('streamDestroyed', function (event) {
		// Update the page layout
		numOfVideos--;
		updateLayout();
	});


	// --- 3) Connect to the session ---

	// Remember 'userId' param (usually called 'token') is irrelevant when using the insecure version of OpenVidu
	session.connect(userId, function (error) {

		// If the connection is successful, initialize a publisher and publish to the session
		if (!error) {

			// --- 4) Get your own camera stream with the desired resolution ---

			publisher = OV.initPublisher('publisher', {
				audio: true,
				video: true,
				quality: 'MEDIUM'
			});

			publisher.on('videoElementCreated', function (event) {
				// When your own video is added to DOM, update the page layout to fit it
				numOfVideos++;
				updateLayout();
				$(event.element).prop('muted', true); // Mute local video
			});

			// --- 5) Publish your stream ---

			session.publish(publisher);

		} else {
			console.log('There was an error connecting to the session:', error.code, error.message);
		}
	});

	// Update the URL shown in the browser's navigation bar to show the session id
	var pathname = (location.pathname.slice(-1) === "/" ? location.pathname : location.pathname+"/");
	window.history.pushState("", "", pathname + sessionId);

	// Auxiliary methods to show the session's view
	showSessionHideJoin();
	initializeSessionView();

	return false;
}


function leaveRoom() {
	
	// --- 6) Leave the session by calling 'disconnect' method over the Session object ---
	session.disconnect();
	
	// Back to welcome page
	window.location.href = window.location.origin + window.location.pathname;
}



/* AUXILIARY MEHTODS */

function muteAudio() {
	audioEnabled = !audioEnabled;
	publisher.publishAudio(audioEnabled);
	if (!audioEnabled) {
		$('#mute-audio').removeClass('btn-primary');
		$('#mute-audio').addClass('btn-default');
	} else {
		$('#mute-audio').addClass('btn-primary');
		$('#mute-audio').removeClass('btn-default');
	}

}

function muteVideo() {
	videoEnabled = !videoEnabled;
	publisher.publishVideo(videoEnabled);

	if (!videoEnabled) {
		$('#mute-video').removeClass('btn-primary');
		$('#mute-video').addClass('btn-default');
	} else {
		$('#mute-video').addClass('btn-primary');
		$('#mute-video').removeClass('btn-default');
	}

}


// Generate a random string for sessionId and userId
function randomString() {
	return Math.random().toString(36).slice(2);
}

// 'Session' page
function showSessionHideJoin() {
	$('#nav-join').hide();
	$('#nav-session').show();
	$('#join').hide();
	$('#session').show();
	$('footer').hide();
	$('#main-container').removeClass('container');
}

// 'Join' page 
function showJoinHideSession() {
	$('#nav-join').show();
	$('#nav-session').hide();
	$('#join').show();
	$('#session').hide();
	$('footer').show();
	$('#main-container').addClass('container');
}

// Prepare HTML dynamic elements (URL clipboard input)
function initializeSessionView() {
	// Tooltips
	$('[data-toggle="tooltip"]').tooltip();
	// Input clipboard
	$('#copy-input').val(window.location.href);
	$('#copy-button').bind('click', function () {
		var input = document.getElementById('copy-input');
		input.focus();
		input.setSelectionRange(0, input.value.length);
		try {
			var success = document.execCommand('copy');
			if (success) {
				$('#copy-button').trigger('copied', ['Copied!']);
			} else {
				$('#copy-button').trigger('copied', ['Copy with Ctrl-c']);
			}
		} catch (err) {
			$('#copy-button').trigger('copied', ['Copy with Ctrl-c']);
		}
	});

	// Handler for updating the tooltip message.
	$('#copy-button').bind('copied', function (event, message) {
		$(this).attr('title', message)
			.tooltip('fixTitle')
			.tooltip('show')
			.attr('title', "Copy to Clipboard")
			.tooltip('fixTitle');
	});
}

// Dynamic layout adjustemnt depending on number of videos
function updateLayout() {
	console.warn('There are now ' + numOfVideos + ' videos');

	var publisherDiv = $('#publisher');
	var publisherVideo = $("#publisher video");
	var subscriberVideos = $('#videos > video');

	publisherDiv.removeClass();
	publisherVideo.removeClass();
	subscriberVideos.removeClass();

	switch (numOfVideos) {
		case 1:
			publisherVideo.addClass('video1');
			break;
		case 2:
			publisherDiv.addClass('video2');
			subscriberVideos.addClass('video2');
			break;
		case 3:
			publisherDiv.addClass('video3');
			subscriberVideos.addClass('video3');
			break;
		case 4:
			publisherDiv.addClass('video4');
			publisherVideo.addClass('video4');
			subscriberVideos.addClass('video4');
			break;
		default:
			publisherDiv.addClass('videoMore');
			publisherVideo.addClass('videoMore');
			subscriberVideos.addClass('videoMore');
			break;
	}
}

/* AUXILIARY METHODS */