var OV;
var session;

var sessionId;
var token;
var nickName;
var userName;
var sessionName;


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
			
				// Add a new <p> element for the user's name and nickname just below its video
				appendUserData(event.element, subscriber.stream.connection);
			});
		});

		// On every Stream destroyed...
		session.on('streamDestroyed', function (event) {
			// Delete the HTML element with the user's name and nickname
			removeUserData(event.stream.connection);
		});


		// --- 3) Connect to the session passing the retrieved token and some more data from
		//         the client (in this case a JSON with the nickname chosen by the user) ---

		session.connect(token, '{"clientData": "' + nickName + '"}', function (error) {

			// If the connection is successful, initialize a publisher and publish to the session
			if (!error) {

				// Here we check somehow if the user has at least 'PUBLISHER' role before
				// trying to publish its stream. Even if someone modified the client's code and
				// published the stream, it wouldn't work if the token sent in Session.connect
				// method doesn't belong to a 'PUBLIHSER' role
				if (isPublisher()) {

					// --- 4) Get your own camera stream ---

					var publisher = OV.initPublisher('video-container', {
						audio: true,
						video: true,
						quality: 'MEDIUM'
					});

					// When our HTML video has been added to DOM...
					publisher.on('videoElementCreated', function (event) {
						// Init the main video with ours and append our data
						var userData = {
							nickName: nickName,
							userName: userName
						};
						initMainVideo(event.element, userData);
						appendUserData(event.element, userData);
						$(event.element).prop('muted', true);  // Mute lcoal video
					});


					// --- 5) Publish your stream ---

					session.publish(publisher);

				} else {
					console.warn('You don\'t have permissions to publish');
					initMainVideoThumbnail(); // Show SUBSCRIBER message in main video
				}
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

	// Removing all HTML elements with the user's nicknames
	cleanSessionView();

	$('#join').show();
	$('#session').hide();
}

/* OPENVIDU METHODS */



/* APPLICATION REST METHODS */

function logIn() {
	var user = $("#user").val(); // Username
	var pass = $("#pass").val(); // Password
	var jsonBody = JSON.stringify({ // Body of POST request
		'user': user,
		'pass': pass
	});

	userName = user;

	httpRequest('POST', '/api-login/login', jsonBody, 'Login WRONG', function successCallback(response){ // Send POST request
		console.warn(userName + ' login');
		$("#name-user").text(user);
		$("#not-logged").hide();
		$("#logged").show();
		// Random nickName and session
		$("#sessionName").val("Session " + Math.floor(Math.random() * 10));
		$("#participantName").val("Participant " + Math.floor(Math.random() * 100));
	});
}

function logOut() {
	httpRequest('GET', 'api-login/logout', null, 'Logout WRONG', function successCallback(response) {
		console.warn(userName + ' logout');
		$("#not-logged").show();
		$("#logged").hide();
	});
}

function getSessionIdAndToken(callback) {
	sessionName = $("#sessionName").val(); // Video-call chosen by the user
	nickName = $("#participantName").val(); // Nickname chosen by the user
	var jsonBody = JSON.stringify({ // Body of POST request
		'session': sessionName
	});

	// Send POST request
	httpRequest('POST', 'api-sessions/get-sessionid-token', jsonBody, 'Request of SESSIONID and TOKEN gone WRONG:', function successCallback(response) {
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
	httpRequest('POST', 'api-sessions/remove-user', jsonBody, 'User couldn\'t be removed from session', function successCallback(response) {
		console.warn(userName + " correctly removed from session");
	});
}

function httpRequest(method, url, body, errorMsg, callback) {
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
				console.warn(errorMsg);
				console.warn(http.responseText);
			}
		}
	}
}

/* APPLICATION REST METHODS */



/* APPLICATION BROWSER METHODS */

window.onbeforeunload = function () { // Gracefully leave session
	if (session) {
		removeUser();
		leaveSession();
	}
	logOut();
}

function appendUserData(videoElement, connection) {
	var clientData;
	var serverData;
	var nodeId;
	if (connection.nickName) { // Appending local video data
		clientData = connection.nickName;
		serverData = connection.userName;
		nodeId = 'main-videodata';
	} else {
		clientData = JSON.parse(connection.data.split('%/%')[0]).clientData;
		serverData = JSON.parse(connection.data.split('%/%')[1]).serverData;
		nodeId = connection.connectionId;
	}
	var dataNode = document.createElement('div');
	dataNode.className = "data-node";
	dataNode.id = "data-" + nodeId;
	dataNode.innerHTML = "<p class='nickName'>" + clientData + "</p><p class='userName'>" + serverData + "</p>";
	videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
	addClickListener(videoElement, clientData, serverData);
}

function removeUserData(connection) {
	var userNameRemoved = $("#data-" + connection.connectionId);
	if ($(userNameRemoved).find('p.userName').html() === $('#main-video p.userName').html()) {
		cleanMainVideo(); // The participant focused in the main video has left
	}
	$("#data-" + connection.connectionId).remove();
}

function removeAllUserData() {
	$(".data-node").remove();
}

function cleanMainVideo() {
	$('#main-video video').get(0).srcObject = null;
	$('#main-video p').each(function () {
		$(this).html('');
	});
}

function addClickListener(videoElement, clientData, serverData) {
	videoElement.addEventListener('click', function () {
		var mainVideo = $('#main-video video').get(0);
		if (mainVideo.srcObject !== videoElement.srcObject) {
			$('#main-video p.nickName').html(clientData);
			$('#main-video p.userName').html(serverData);
			mainVideo.srcObject = videoElement.srcObject;
		}
	});
}

function initMainVideo(videoElement, userData) {
	$('#main-video video').get(0).srcObject = videoElement.srcObject;
	$('#main-video p.nickName').html(userData.nickName);
	$('#main-video p.userName').html(userData.userName);
	$('#main-video video').prop('muted', true);
}

function initMainVideoThumbnail() {
	$('#main-video video').css("background", "url('images/subscriber-msg.jpg') round");
}

function isPublisher() {
	return userName.includes('publisher');
}

function cleanSessionView() {
	removeAllUserData();
	cleanMainVideo();
	$('#main-video video').css("background", "");
}

/* APPLICATION BROWSER METHODS */