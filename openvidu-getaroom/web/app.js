var OV;						// OpenVidu object to initialize a session
var session;				// Session object where the user will connect
var publisher;				// Publisher object which the user will publish
var sessionId;				// Unique identifier of the session
var audioEnabled = true;	// True if the audio track of publisher is active
var videoEnabled = true;	// True if the video track of publisher is active
var numOfVideos = 0;		// Keeps track of the number of videos that are being shown


// Check if the URL already has a room
window.addEventListener('load', function () {
	sessionId = window.location.hash.slice(1); // For 'https://myurl/#roomId', sessionId would be 'roomId'
	if (sessionId) {
		// The URL has a session id. Join the room right away
		console.log("Joining to room " + sessionId);
		showSessionHideJoin();
		joinRoom();
	} else {
		// The URL has not a session id. Show welcome page
		showJoinHideSession();
	}
});

// Disconnect participant on browser's window closed
window.addEventListener('beforeunload', function () {
	if (session) session.disconnect();
});


function joinRoom() {

	if (!sessionId) {
		// If the user is joining to a new room
		sessionId = randomString();
	}

	// --- 1) Get an OpenVidu object ---

	OV = new OpenVidu();

	// --- 2) Init a session ---

	session = OV.initSession();


	// --- 3) Specify the actions when events take place in the session ---

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


	// --- 4) Connect to the session with a valid user token ---

	// 'getToken' method is simulating what your server-side should do.
	// 'token' parameter should be retrieved and returned by your own backend
	getToken(sessionId).then(token => {

		// Connect with the token
		session.connect(token)
			.then(() => {

				// --- 5) Set page layout for active call ---

				// Update the URL shown in the browser's navigation bar to show the session id
				var path = (location.pathname.slice(-1) == "/" ? location.pathname : location.pathname + "/");
				window.history.pushState("", "", path + '#' + sessionId);

				// Auxiliary methods to show the session's view
				showSessionHideJoin();
				initializeSessionView();

				// --- 6) Get your own camera stream with the desired properties ---

				publisher = OV.initPublisher('videos', {
					audioSource: undefined, // The source of audio. If undefined default audio input
					videoSource: undefined, // The source of video. If undefined default video input
					publishAudio: true,  	// Whether to start publishing with your audio unmuted or not
					publishVideo: true,  	// Whether to start publishing with your video enabled or not
					resolution: '640x480',  // The resolution of your video
					frameRate: 30,			// The frame rate of your video
					insertMode: 'PREPEND',	// How the video is inserted in target element 'video-container'
					mirror: true       		// Whether to mirror your local video or not
				});

				// --- 7) Specify the actions when events take place in our publisher ---

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', function (event) {
					// When your own video is added to DOM, update the page layout to fit it
					numOfVideos++;
					updateLayout();
					$(event.element).prop('muted', true); // Mute local video to avoid feedback
				});

				// --- 8) Publish your stream ---

				session.publish(publisher);
			})
			.catch(error => {
				console.log('There was an error connecting to the session:', error.code, error.message);
			});
	});
}


function leaveRoom() {

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---

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



/**
 * --------------------------
 * SERVER-SIDE RESPONSIBILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
 *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
 *   3) The Connection.token must be consumed in Session.connect() method
 */

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";

function getToken(mySessionId) {
	return createSession(mySessionId).then(sId => createToken(sId));
}

function createSession(sessionId) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessions
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: OPENVIDU_SERVER_URL + "/openvidu/api/sessions",
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

function createToken(sessionId) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessionsltsession_idgtconnection
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: OPENVIDU_SERVER_URL + '/openvidu/api/sessions/' + sessionId + '/connection',
            data: JSON.stringify({}),
            headers: {
                'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                'Content-Type': 'application/json',
            },
            success: (response) => resolve(response.token),
            error: (error) => reject(error)
        });
    });
}