var OV;
var session;

function joinSession() {

	var mySessionId = document.getElementById("sessionId").value;

	OV = new OpenVidu();
	session = OV.initSession();

	session.on("streamCreated", function (event) {
		session.subscribe(event.stream, "subscriber");
	});

	getToken(mySessionId).then(token => {

		session.connect(token)
			.then(() => {
				document.getElementById("session-header").innerText = mySessionId;
				document.getElementById("join").style.display = "none";
				document.getElementById("session").style.display = "block";

				var publisher = OV.initPublisher("publisher");
				session.publish(publisher);
			})
			.catch(error => {
				console.log("There was an error connecting to the session:", error.code, error.message);
			});
	});

}

function leaveSession() {
	session.disconnect();
	document.getElementById("join").style.display = "block";
	document.getElementById("session").style.display = "none";
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
 *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
 *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
 *   3) The token must be consumed in Session.connect() method
 */

function getToken(mySessionId) {
	return createSession(mySessionId).then(sessionId => createToken(sessionId));
}

function createSession(sessionId) {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: "https://" + location.hostname + ":4443/api/sessions",
			data: JSON.stringify({ customSessionId: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.id),
			error: error => error.status === 409 ? resolve(sessionId) : reject(error)
		});
	});
}

function createToken(sessionId) {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: "https://" + location.hostname + ":4443/api/tokens",
			data: JSON.stringify({ session: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.token),
			error: error => reject(error)
		});
	});
}