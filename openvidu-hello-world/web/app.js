var OV;
var session;
var sessionId;

function joinSession() {

	OV = new OpenVidu();
	session = OV.initSession();

	session.on('streamCreated', function (event) {
		session.subscribe(event.stream, 'subscriber');
	});

	sessionId = document.getElementById("sessionId").value;
	getToken().then(token => {

		session.connect(token)
			.then(() => {
				var publisher = OV.initPublisher('publisher');
				session.publish(publisher);
			})
			.catch(error => {
				console.log('There was an error connecting to the session:', error.code, error.message);
			});

	});

	document.getElementById('session-header').innerText = sessionId;
	document.getElementById('join').style.display = 'none';
	document.getElementById('session').style.display = 'block';
}

function leaveSession() {

	session.disconnect();

	document.getElementById('join').style.display = 'block';
	document.getElementById('session').style.display = 'none';
}

window.onbeforeunload = function () {
	if (session) session.disconnect()
};


/**
 * --------------------------
 * SERVER-SIDE RESPONSABILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) POST /api/sessions
 *   2) POST /api/tokens
 *   3) The value returned by /api/tokens must be consumed in Session.connect() method
 */

function getToken() {
	return new Promise(async function (resolve) {
		// POST /api/sessions
		await apiSessions();
		// POST /api/tokens
		let t = await apiTokens();
		// Return the user token
		resolve(t);
	});
}

function apiSessions() {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: "https://" + location.hostname + ":4443/api/sessions",
			data: JSON.stringify({ customSessionId: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: (response) => {
				resolve(response.id)
			},
			error: (error) => {
				if (error.status === 409) {
					resolve(sessionId);
				} else {
					reject(error)
				}
			}
		});
	});
}

function apiTokens() {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: "https://" + location.hostname + ":4443/api/tokens",
			data: JSON.stringify({ session: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: (response) => {
				resolve(response.id)
			},
			error: (error) => { reject(error) }
		});
	});
}