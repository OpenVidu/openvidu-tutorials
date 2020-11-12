// OpenVidu variables
var OV;
var session;
var publisher;

// Application variables
var role = 'PUBLISHER'; 	// ['SUBSCRIBER', 'PUBLISHER', 'MODERATOR']
var selectedStreamManager; 	// Our Publisher or any Subscriber (see https://openvidu.io/api/openvidu-browser/classes/streammanager.html)



/* OPENVIDU METHODS */

function joinSession() {

	var mySessionId = $("#sessionId").val();
	var myUserName = $("#userName").val();
	var startWithFilterEnabled = $('#start-filter-enabled').prop('checked');

	// --- 1) Get an OpenVidu object ---

	OV = new OpenVidu();

	// --- 2) Init a session ---

	session = OV.initSession();

	// --- 3) Specify the actions when events take place in the session ---

	// On every new Stream received...
	session.on('streamCreated', event => {

		// Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
		var subscriber = session.subscribe(event.stream, 'video-container');

		// When the HTML video has been appended to DOM...
		subscriber.on('videoElementCreated', event => {
			// Add a new <p> element for the user's nickname just below its video
			appendUserData(event.element, subscriber);
		});

		// When the video starts playing remove the spinner
		subscriber.on('streamPlaying', function (event) {
			$('#spinner-' + subscriber.stream.connection.connectionId).remove();
		});

		// Listen to any subscriber filter applied or removed to update the filter control buttons
		subscriber.on('streamPropertyChanged', function (event) {
			// If the changed property is the filter and the current selected streamManager is this subscriber's one
			if (subscriber === selectedStreamManager && event.changedProperty === 'filter') {
				if (!!event.newValue) {
					showRemoveFilterButtons();
				} else {
					showApplyFilterButtons();
				}
			}
		});
	});

	// On every Stream destroyed...
	session.on('streamDestroyed', event => {

		// Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
		removeUserData(event.stream.connection);
	});

	// --- 4) Connect to the session with a valid user token ---

	// 'getToken' method is simulating what your server-side should do.
	// 'token' parameter should be retrieved and returned by your own backend
	getToken(mySessionId, role).then(token => {

		// First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
		// 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
		session.connect(token, { clientData: myUserName })
			.then(() => {

				// --- 5) Set page layout for active call ---

				$('#session-title').text(mySessionId);
				$('#join').hide();
				$('#session').show();

				// --- 6) Get your own camera stream with the desired properties ---

				if (role !== 'SUBSCRIBER') {
					var publisherProperties = {
						audioSource: undefined, // The source of audio. If undefined default microphone
						videoSource: undefined, // The source of video. If undefined default webcam
						publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
						publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
						resolution: '1280x720',  // The resolution of your video
						frameRate: 30,			// The frame rate of your video
						insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'
						mirror: false       	// Whether to mirror your local video or not
					};

					// If the filter should be enabled from the beginning of the publishing
					if (startWithFilterEnabled) {
						publisherProperties.filter = {
							type: 'GStreamerFilter',
							options: { "command": "videobalance saturation=0.0" }
						}
					}

					publisher = OV.initPublisher('video-container', publisherProperties);

					// --- 7) Specify the actions when events take place in our publisher ---

					// When our HTML video has been added to DOM...
					publisher.on('videoElementCreated', function (event) {
						appendUserData(event.element, publisher);
						initMainVideo(publisher, myUserName);
					});
					// When our video has started playing...
					publisher.on('streamPlaying', function (event) {
						$('#spinner-' + publisher.stream.connection.connectionId).remove();
						$('#filter-btns').show();
						$('#buttonApplyFilter').prop('value', 'Apply filter to your stream');
						$('#buttonRemoveFilter').prop('value', 'Remove filter of your stream');
						$('#buttonApplyFilter').prop('disabled', false);
						$('#buttonRemoveFilter').prop('disabled', false);
						if (startWithFilterEnabled) {
							showRemoveFilterButtons();
						} else {
							showApplyFilterButtons();
						}
					});

					// Listen to your filter being applied or removed to update the filter control buttons
					publisher.on('streamPropertyChanged', function (event) {
						// If the changed property is the filter and the current selected streamManager is our publisher
						if (publisher === selectedStreamManager && event.changedProperty === 'filter') {
							if (!!event.newValue) {
								showRemoveFilterButtons();
							} else {
								showApplyFilterButtons();
							}
						}
					});

					// --- 8) Publish your stream, indicating you want to receive your remote stream to see the filters ---
					publisher.subscribeToRemote();
					session.publish(publisher);

				} else {
					// Show a message warning the subscriber cannot publish
					$('#main-video video').css("background", "url('resources/images/subscriber-msg.jpg') round");
					$('#filter-btns').hide();
				}
			})
			.catch(error => {
				console.log('There was an error connecting to the session:', error.code, error.message);
			});
	});
}

function leaveSession() {

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---

	session.disconnect();

	// Removing all HTML elements with user's nicknames.
	// HTML videos are automatically removed when leaving a Session
	removeAllUserData();

	// Back to 'Join session' page
	$('#join').show();
	$('#filter-btns').hide();
	$('#session').hide();
}


// --- Filter related methods ---

function applyFilter() {
	var filter = { type: '', options: {} };
	var type = $('input[name=filter]:checked').val();
	switch (type) {
		case 'Grayscale':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": "videobalance saturation=0.0" };
			break;
		case 'Rotation':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": "videoflip method=vertical-flip" };
			break;
		case 'Faceoverlay':
			filter.type = 'FaceOverlayFilter';
			filter.options = {};
			break;
		case 'Audioecho':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": "audioecho delay=40000000 intensity=0.7 feedback=0.4" };
			break;
		case 'Amplify':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": "audioamplify amplification=1.7" };
			break;
		case 'Pitch':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": "pitch pitch=1.2" };
			break;
		case 'Videobox':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": "videobox fill=black top=-30 bottom=-30 left=-30 right=-30" };
			break;
		case 'Text':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": 'textoverlay text="Embedded text!" valignment=top halignment=right font-desc="Cantarell 25" draw-shadow=false' };
			break;
		case 'Time':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": 'timeoverlay valignment=bottom halignment=right font-desc="Sans, 20"' };
			break;
		case 'Clock':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": 'clockoverlay valignment=bottom halignment=right shaded-background=true font-desc="Sans, 20"' };
			break;
		case 'Chroma':
			filter.type = 'GStreamerFilter';
			filter.options = { "command": 'chromahold target-r=0 target-g=0 target-b=255 tolerance=90' };
			break;
	}
	selectedStreamManager.stream.applyFilter(filter.type, filter.options)
		.then(f => {
			if (f.type === 'FaceOverlayFilter') {
				f.execMethod(
					"setOverlayedImage",
					{
						"uri": "https://cdn.pixabay.com/photo/2017/09/30/09/29/cowboy-hat-2801582_960_720.png",
						"offsetXPercent": "-0.1F",
						"offsetYPercent": "-0.8F",
						"widthPercent": "1.5F",
						"heightPercent": "1.0F"
					});
			}
		});
}

function removeFilter() {
	selectedStreamManager.stream.removeFilter();
}

// --- End filter related methods ---



/* APPLICATION SPECIFIC METHODS */

window.addEventListener('load', function () {
	generateParticipantInfo();
	$('[data-toggle="tooltip"]').tooltip({ container: 'body', trigger: 'hover' });
});

window.onbeforeunload = function () {
	if (session) session.disconnect();
};

function generateParticipantInfo() {
	$('#sessionId').val("SessionA");
	$('#userName').val("Participant" + Math.floor(Math.random() * 100));
}

function handleRadioBtnClick(myRadio) {
	this.role = myRadio.value;
	if (this.role !== 'SUBSCRIBER') {
		$('#filter-enabled').show();
	} else {
		$('#filter-enabled').hide();
	}
}

function showApplyFilterButtons() {
	$('#filter-applied-opts').show();
	$('#filter-removed-opts').hide();
}

function showRemoveFilterButtons() {
	$('#filter-applied-opts').hide();
	$('#filter-removed-opts').show();
}

var spinnerNodeHtml =
	'<div class="spinner"><div class="sk-circle1 sk-child"></div><div class="sk-circle2 sk-child"></div><div class="sk-circle3 sk-child"></div>' +
	'<div class="sk-circle4 sk-child"></div><div class="sk-circle5 sk-child"></div><div class="sk-circle6 sk-child"></div><div class="sk-circle7 sk-child"></div>' +
	'<div class="sk-circle8 sk-child"></div><div class="sk-circle9 sk-child"></div><div class="sk-circle10 sk-child"></div><div class="sk-circle11 sk-child"></div>' +
	'<div class="sk-circle12 sk-child"></div></div>';

function appendUserData(videoElement, streamManager) {
	var userData = JSON.parse(streamManager.stream.connection.data).clientData;
	var nodeId = streamManager.stream.connection.connectionId;
	// Insert user nickname
	var dataNode = $('<div id="data-' + nodeId + '" class="data-node"><p>' + userData + '</p></div>');
	dataNode.insertAfter($(videoElement));
	// Insert spinner loader
	var spinnerNode = $(spinnerNodeHtml).attr('id', 'spinner-' + nodeId)
	dataNode.append(spinnerNode);
	addClickListener(videoElement, streamManager);
}

function removeUserData(connection) {
	$("#data-" + connection.connectionId).remove();
}

function removeAllUserData() {
	$(".data-node").remove();
	$('#main-video div p').html('');
}

function addClickListener(videoElement, streamManager) {
	videoElement.addEventListener('click', function () {
		var mainVideo = $('#main-video video').get(0);
		// Only apply all these changes if not clicked on the same video again
		if (!streamManager.videos.map(v => v.video).includes(mainVideo)) {
			selectedStreamManager = streamManager;
			$('#main-video').fadeOut("fast", () => {
				// Put the nickname of the clicked user in the main video view
				var nickname = JSON.parse(streamManager.stream.connection.data).clientData;
				$('#main-video div p').html(nickname);
				// Change the ownership of the main video to the clicked StreamManager (Publisher or Subscriber)
				streamManager.addVideoElement(mainVideo);
				// Show the required filter buttons depending on whether the filter is applied or not for the selected StreamManager
				if (!!streamManager.stream.filter) {
					showRemoveFilterButtons();
				} else {
					showApplyFilterButtons();
				}
				// Change the text of the filter buttons depending on whether the selected StreamManager is your Publisher or a Subscriber
				if (streamManager !== publisher) {
					$('#buttonApplyFilter').prop('value', 'Apply filter to ' + nickname);
					$('#buttonRemoveFilter').prop('value', 'Remove filter of ' + nickname);
					if (role === 'PUBLISHER') {
						// Publishers cannot manage other user's filters
						$('#buttonApplyFilter').prop('disabled', true);
						$('#buttonRemoveFilter').prop('disabled', true);
					}
				} else {
					$('#buttonApplyFilter').prop('value', 'Apply filter to your stream');
					$('#buttonRemoveFilter').prop('value', 'Remove filter of your stream');
					$('#buttonApplyFilter').prop('disabled', false);
					$('#buttonRemoveFilter').prop('disabled', false);
				}
				$('#main-video').fadeIn("fast");
			});
		}
	});
}

function initMainVideo(streamManager, userData) {
	var videoEl = $('#main-video video').get(0);
	videoEl.onplaying = () => {
		$('#main-video div .spinner').remove();
	};
	streamManager.addVideoElement(videoEl);
	$('#main-video div p').html(userData);
	$('#main-video div').append($(spinnerNodeHtml));
	$('#main-video video').prop('muted', true);
	selectedStreamManager = streamManager;
}



/**
 * --------------------------
 * SERVER-SIDE RESPONSIBILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the REST API, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
 *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
 *   3) The Connection.token must be consumed in Session.connect() method
 */

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";

function getToken(mySessionId, role) {
	return createSession(mySessionId).then(sessionId => createToken(sessionId, role));
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


function createToken(sessionId, role) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessionsltsession_idgtconnection
	var openviduRole;
	var jsonBody = {
		role: role,
		kurentoOptions: {}
	};

	if (openviduRole !== 'SUBSCRIBER') {
		// Only the PUBLISHERS and MODERATORS need to configure the ability of applying filters
		jsonBody.kurentoOptions = {
			allowedFilters: ['FaceOverlayFilter', 'ChromaFilter', 'GStreamerFilter']
		}
	}

	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: OPENVIDU_SERVER_URL + "/openvidu/api/sessions/" + sessionId + "/connection",
			data: JSON.stringify(jsonBody),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.token),
			error: error => reject(error)
		});
	});
}
