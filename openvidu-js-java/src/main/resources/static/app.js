var OV;
var userName;
var session;
var sessionName;
var sessionId;
var token;


/* APPLICATION BROWSER METHODS */

window.onbeforeunload = function () { // Gracefully leave session
	if (session) {
		removeUser();
		leaveSession();
	}
	logOut();
}

function appendUserData(videoElement, connection) {
	var clientDataJSON = JSON.parse(connection.data.split('%/%')[0]);
	var serverDataJSON = JSON.parse(connection.data.split('%/%')[1]);
	$("<p id='data-" + connection.connectionId + "' class='data-node'>Nickname: " + clientDataJSON.clientData +
		"<br/>Username: " + serverDataJSON.serverData + "</p>"
	).insertAfter(videoElement);
}

function removeUserData(connection) {
	$("#data-" + connection.connectionId).remove();
}

function removeAllUserData() {
	$(".data-node").remove();
}

function isPublisher() {
	return userName.includes('publisher');
}

/* APPLICATION BROWSER METHODS */



/* APPLICATION BACKEND METHODS */

function logIn() {
	var user = $("#user").val();
	userName = user;
	var pass = $("#pass").val();
	var jsonBody = JSON.stringify({
		'user': user,
		'pass': pass
	});

	httpRequest('POST', '/api-login/login', jsonBody, 'Login WRONG', function successCallback(response) {
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
	httpRequest('GET', '/api-login/logout', null, 'Logout WRONG', function successCallback(response) {
		console.warn(userName + ' logout');
		$("#not-logged").show();
		$("#logged").hide();
	});
}

function getSessionIdAndToken(callback) {
	sessionName = $("#sessionName").val();
	var jsonBody = JSON.stringify({
		'session': sessionName
	});

	httpRequest('POST', '/api-sessions/get-sessionid-token', jsonBody, 'Request of SESSIONID and TOKEN gone WRONG:', function successCallback(response) {
		sessionId = response[0];
		token = response[1];
		console.warn('Request of SESSIONID and TOKEN gone WELL (SESSIONID:' + sessionId + ", TOKEN:" + token + ")");
		callback();
	});
}

function removeUser() {
	var jsonBody = JSON.stringify({
		'sessionName': sessionName,
		'token': token
	});

	httpRequest('POST', '/api-sessions/remove-user', jsonBody, 'User couldn\'t be removed from session', function successCallback(response) {
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

/* APPLICATION BACKEND METHODS */



/* OPENVIDU METHODS */

function joinSession() {
	getSessionIdAndToken(function () {

		// 1) Get an OpenVidu object and init a session with a sessionId

		OV = new OpenVidu();
		session = OV.initSession(sessionId);


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

		session.connect(token, '{"clientData": "' + $("#participantName").val() + '"}', function (error) {

			// If the connection is successful, initialize a publisher and publish to the session (only if the user is supposed to do so)
			if (!error) {

				// If the user has enough permissions
				if (isPublisher()) {

					// 4) Get your own camera stream with the desired resolution and publish it

					var publisher = OV.initPublisher('publisher', {
						audio: true,
						video: true,
						quality: 'MEDIUM'
					});


					// 5) Publish your stream

					session.publish(publisher);

				} else {
					console.warn('You don\'t have permissions to publish');
				}
			} else {
				console.warn('There was an error connecting to the session:', error.code, error.message);
			}
		});

		$('#session-header').text(sessionName);
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
	removeAllUserData();

	$('#join').show();
	$('#session').hide();
}

/* OPENVIDU METHODS */