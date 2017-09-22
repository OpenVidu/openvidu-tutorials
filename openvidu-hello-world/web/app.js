var OV;
var session;

function joinSession() {

	var sessionId = document.getElementById("sessionId").value;

	OV = new OpenVidu();
	session = OV.initSession("wss://" + location.hostname + ":8443/" + sessionId + '?secret=MY_SECRET');

	session.on('streamCreated', function (event) {
		var subscriber = session.subscribe(event.stream, 'subscriber');
	});

	session.connect(null, function (error) {

		if (!error) {
			var publisher = OV.initPublisher('publisher');
			session.publish(publisher);
		} else {
			console.log('There was an error connecting to the session:', error.code, error.message);
		}
		
	});

	document.getElementById('session-header').innerText = sessionId;
	document.getElementById('join').style.display = 'none';
	document.getElementById('session').style.display = 'block';

	return false;
}

function leaveSession() {

	session.disconnect();

	document.getElementById('join').style.display = 'block';
	document.getElementById('session').style.display = 'none';
}

window.onbeforeunload = function () {
	if (session) session.disconnect()
};