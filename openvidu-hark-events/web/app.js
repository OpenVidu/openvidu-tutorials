var OV;
var session;
var publisher;
var subscriber;

function joinSession() {

	var mySessionId = document.getElementById("sessionId").value;

	OV = new OpenVidu();
	OV.enableProdMode();
	session = OV.initSession();

	session.on("streamCreated", function (event) {
		if (!subscriber) {
			subscriber = session.subscribe(event.stream, "subscriber");
		}
	});

	// On every asynchronous exception...
	session.on('exception', (exception) => {
		console.warn(exception);
	});

	getToken(mySessionId).then(token => {

		session.connect(token)
			.then(() => {
				document.getElementById("session-header").innerText = mySessionId;
				document.getElementById("join").style.display = "none";
				document.getElementById("session").style.display = "block";

				publisher = OV.initPublisher("publisher");
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

let publisherStartSpeakingSession = [];
let publisherStopSpeakingSession = [];

let publisherStartSpeakingPublisher = [];
let publisherStopSpeakingPublisher = [];

let publisherStartSpeakingSubscriber = [];
let publisherStopSpeakingSubscriber = [];

let streamAudioVolumeChangePublisher = [];
let streamAudioVolumeChangeSubscriber = [];

function attachHandlerHtml(arrayName, handlerNumber, removeCallback) {
	const element = document.createElement('input');
	element.type = 'button';
	element.className = 'handler-btn';
	element.id = arrayName + '-handler' + handlerNumber;
	element.value = 'Handler ' + handlerNumber;
	element.onclick = () => {
		removeCallback();
	};
	document.getElementById(arrayName).append(element);
}

function removeHandlerHtml(regexId) {
	const regexp = new RegExp('^' + regexId + '$');
	const elements = document.getElementById('handlers').getElementsByClassName('handler-btn');
	for (let i = elements.length - 1; i >= 0; i--) {
		let elem = elements[i];
		if (regexp.test(elem.id)) {
			elem.parentNode.removeChild(elem);
		}
	}
}

function offEvent(eventName, target, array, handler, handlerNumber) {
	if (handler != null) {
		target.off(eventName, handler);
		array.splice(array.indexOf(handler), 1);
		removeHandlerHtml(eventName + target.constructor.name + '-handler' + handlerNumber);
	} else {
		target.off(eventName);
		array = [];
		removeHandlerHtml(eventName + target.constructor.name + '-handler.+');
	}
	return array;
}

function onPublisherStartSpeakingSession() {
	const handlerNumber = publisherStartSpeakingSession.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStartSpeaking triggered by ' + event.target.constructor.name + ' and belonging to ' + (event.connection.stream.streamManager.remote ? 'Subscriber' : 'Publisher'));
	}
	publisherStartSpeakingSession.push(handler);
	attachHandlerHtml('publisherStartSpeakingSession', handlerNumber, () => offEvent('publisherStartSpeaking', session, publisherStartSpeakingSession, handler, handlerNumber));
	session.on('publisherStartSpeaking', handler);
}

function oncePublisherStartSpeakingSession() {
	const handlerNumber = publisherStartSpeakingSession.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStartSpeaking (ONCE) triggered by ' + event.target.constructor.name + ' and belonging to ' + (event.connection.stream.streamManager.remote ? 'Subscriber' : 'Publisher'));
		publisherStartSpeakingSession.splice(publisherStartSpeakingSession.indexOf(handler), 1);
		removeHandlerHtml('publisherStartSpeakingSession-handler' + handlerNumber);
	}
	publisherStartSpeakingSession.push(handler);
	attachHandlerHtml('publisherStartSpeakingSession', handlerNumber, () => offEvent('publisherStartSpeaking', session, publisherStartSpeakingSession, handler, handlerNumber));
	session.once('publisherStartSpeaking', handler);
}

function offPublisherStartSpeakingSession(handler) {
	const availableHandlers = publisherStartSpeakingSession.length;
	publisherStartSpeakingSession = offEvent('publisherStartSpeaking', session, publisherStartSpeakingSession);
	console.log('Available publisherStartSpeaking handlers for Session: ' + availableHandlers + '. Remaining: ' + publisherStartSpeakingSession.length);
}

function onPublisherStopSpeakingSession() {
	const handlerNumber = publisherStopSpeakingSession.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStopSpeaking triggered by ' + event.target.constructor.name + ' and belonging to ' + (event.connection.stream.streamManager.remote ? 'Subscriber' : 'Publisher'));
	}
	publisherStopSpeakingSession.push(handler);
	attachHandlerHtml('publisherStopSpeakingSession', handlerNumber, () => offEvent('publisherStopSpeaking', session, publisherStopSpeakingSession, handler, handlerNumber));
	session.on('publisherStopSpeaking', handler);
}

function oncePublisherStopSpeakingSession() {
	const handlerNumber = publisherStopSpeakingSession.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStopSpeaking (ONCE) triggered by ' + event.target.constructor.name + ' and belonging to ' + (event.connection.stream.streamManager.remote ? 'Subscriber' : 'Publisher'));
		publisherStopSpeakingSession.splice(publisherStopSpeakingSession.indexOf(handler), 1);
		removeHandlerHtml('publisherStopSpeakingSession-handler' + handlerNumber);
	}
	publisherStopSpeakingSession.push(handler);
	attachHandlerHtml('publisherStopSpeakingSession', handlerNumber, () => offEvent('publisherStopSpeaking', session, publisherStopSpeakingSession, handler, handlerNumber));
	session.once('publisherStopSpeaking', handler);
}

function offPublisherStopSpeakingSession() {
	const availableHandlers = publisherStopSpeakingSession.length;
	publisherStopSpeakingSession = offEvent('publisherStopSpeaking', session, publisherStopSpeakingSession);
	console.log('Available publisherStopSpeaking handlers for Session: ' + availableHandlers + '. Remaining: ' + publisherStopSpeakingSession.length);
}

function onPublisherStartSpeakingPublisher() {
	const handlerNumber = publisherStartSpeakingPublisher.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStartSpeaking triggered by ' + event.target.constructor.name);
	}
	publisherStartSpeakingPublisher.push(handler);
	attachHandlerHtml('publisherStartSpeakingPublisher', handlerNumber, () => offEvent('publisherStartSpeaking', publisher, publisherStartSpeakingPublisher, handler, handlerNumber));
	publisher.on('publisherStartSpeaking', handler);
}

function oncePublisherStartSpeakingPublisher() {
	const handlerNumber = publisherStartSpeakingPublisher.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStartSpeaking (ONCE) triggered by ' + event.target.constructor.name);
		publisherStartSpeakingPublisher.splice(publisherStartSpeakingPublisher.indexOf(handler), 1);
		removeHandlerHtml('publisherStartSpeakingPublisher-handler' + handlerNumber);
	}
	publisherStartSpeakingPublisher.push(handler);
	attachHandlerHtml('publisherStartSpeakingPublisher', handlerNumber, () => offEvent('publisherStartSpeaking', publisher, publisherStartSpeakingPublisher, handler, handlerNumber));
	publisher.once('publisherStartSpeaking', handler);
}

function offPublisherStartSpeakingPublisher() {
	const availableHandlers = publisherStartSpeakingPublisher.length;
	publisherStartSpeakingPublisher = offEvent('publisherStartSpeaking', publisher, publisherStartSpeakingPublisher);
	console.log('Available publisherStartSpeaking handlers for Publisher: ' + availableHandlers + '. Remaining: ' + publisherStartSpeakingPublisher.length);
}

function onPublisherStopSpeakingPublisher() {
	const handlerNumber = publisherStopSpeakingPublisher.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStopSpeaking triggered by ' + event.target.constructor.name);
	}
	publisherStopSpeakingPublisher.push(handler);
	attachHandlerHtml('publisherStopSpeakingPublisher', handlerNumber, () => offEvent('publisherStopSpeaking', publisher, publisherStopSpeakingPublisher, handler, handlerNumber));
	publisher.on('publisherStopSpeaking', handler);
}

function oncePublisherStopSpeakingPublisher() {
	const handlerNumber = publisherStopSpeakingPublisher.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStopSpeaking (ONCE) triggered by ' + event.target.constructor.name);
		publisherStopSpeakingPublisher.splice(publisherStopSpeakingPublisher.indexOf(handler), 1);
		removeHandlerHtml('publisherStopSpeakingPublisher-handler' + handlerNumber);
	}
	publisherStopSpeakingPublisher.push(handler);
	attachHandlerHtml('publisherStopSpeakingPublisher', handlerNumber, () => offEvent('publisherStopSpeaking', publisher, publisherStopSpeakingPublisher, handler, handlerNumber));
	publisher.once('publisherStopSpeaking', handler);
}

function offPublisherStopSpeakingPublisher() {
	const availableHandlers = publisherStopSpeakingPublisher.length;
	publisherStopSpeakingPublisher = offEvent('publisherStopSpeaking', publisher, publisherStopSpeakingPublisher);
	console.log('Available publisherStopSpeaking handlers for Publisher: ' + availableHandlers + '. Remaining: ' + publisherStopSpeakingPublisher.length);
}

function onPublisherStartSpeakingSubscriber() {
	const handlerNumber = publisherStartSpeakingSubscriber.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStartSpeaking triggered by ' + event.target.constructor.name);
	}
	publisherStartSpeakingSubscriber.push(handler);
	attachHandlerHtml('publisherStartSpeakingSubscriber', handlerNumber, () => offEvent('publisherStartSpeaking', subscriber, publisherStartSpeakingSubscriber, handler, handlerNumber));
	subscriber.on('publisherStartSpeaking', handler);
}

function oncePublisherStartSpeakingSubscriber() {
	const handlerNumber = publisherStartSpeakingSubscriber.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStartSpeaking (ONCE) triggered by ' + event.target.constructor.name);
		publisherStartSpeakingSubscriber.splice(publisherStartSpeakingSubscriber.indexOf(handler), 1);
		removeHandlerHtml('publisherStartSpeakingSubscriber-handler' + handlerNumber);
	}
	publisherStartSpeakingSubscriber.push(handler);
	attachHandlerHtml('publisherStartSpeakingSubscriber', handlerNumber, () => offEvent('publisherStartSpeaking', subscriber, publisherStartSpeakingSubscriber, handler, handlerNumber));
	subscriber.once('publisherStartSpeaking', handler);
}

function offPublisherStartSpeakingSubscriber() {
	const availableHandlers = publisherStartSpeakingSubscriber.length;
	publisherStartSpeakingSubscriber = offEvent('publisherStartSpeaking', subscriber, publisherStartSpeakingSubscriber);
	console.log('Available publisherStartSpeaking handlers for Subscriber: ' + availableHandlers + '. Remaining: ' + publisherStartSpeakingSubscriber.length);
}

function onPublisherStopSpeakingSubscriber() {
	const handlerNumber = publisherStopSpeakingSubscriber.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStopSpeaking triggered by ' + event.target.constructor.name);
	}
	publisherStopSpeakingSubscriber.push(handler);
	attachHandlerHtml('publisherStopSpeakingSubscriber', handlerNumber, () => offEvent('publisherStopSpeaking', subscriber, publisherStopSpeakingSubscriber, handler, handlerNumber));
	subscriber.on('publisherStopSpeaking', handler);
}

function oncePublisherStopSpeakingSubscriber() {
	const handlerNumber = publisherStopSpeakingSubscriber.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing publisherStopSpeaking (ONCE) triggered by ' + event.target.constructor.name);
		publisherStopSpeakingSubscriber.splice(publisherStopSpeakingSubscriber.indexOf(handler), 1);
		removeHandlerHtml('publisherStopSpeakingSubscriber-handler' + handlerNumber);
	}
	publisherStopSpeakingSubscriber.push(handler);
	attachHandlerHtml('publisherStopSpeakingSubscriber', handlerNumber, () => offEvent('publisherStopSpeaking', subscriber, publisherStopSpeakingSubscriber, handler, handlerNumber));
	subscriber.once('publisherStopSpeaking', handler);
}

function offPublisherStopSpeakingSubscriber() {
	const availableHandlers = publisherStopSpeakingSubscriber.length;
	publisherStopSpeakingSubscriber = offEvent('publisherStopSpeaking', subscriber, publisherStopSpeakingSubscriber);
	console.log('Available publisherStopSpeaking handlers for Subscriber: ' + availableHandlers + '. Remaining: ' + publisherStopSpeakingSubscriber.length);
}

function onStreamAudioVolumeChangePublisher() {
	const handlerNumber = streamAudioVolumeChangePublisher.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing streamAudioVolumeChange triggered by ' + event.target.constructor.name);
	}
	streamAudioVolumeChangePublisher.push(handler);
	attachHandlerHtml('streamAudioVolumeChangePublisher', handlerNumber, () => offEvent('streamAudioVolumeChange', publisher, streamAudioVolumeChangePublisher, handler, handlerNumber));
	publisher.on('streamAudioVolumeChange', handler);
}

function onceStreamAudioVolumeChangePublisher() {
	const handlerNumber = streamAudioVolumeChangePublisher.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing streamAudioVolumeChange (ONCE) triggered by ' + event.target.constructor.name);
		streamAudioVolumeChangePublisher.splice(streamAudioVolumeChangePublisher.indexOf(handler), 1);
		removeHandlerHtml('streamAudioVolumeChangePublisher-handler' + handlerNumber);
	}
	streamAudioVolumeChangePublisher.push(handler);
	attachHandlerHtml('streamAudioVolumeChangePublisher', handlerNumber, () => offEvent('streamAudioVolumeChange', publisher, streamAudioVolumeChangePublisher, handler, handlerNumber));
	publisher.once('streamAudioVolumeChange', handler);
}

function offStreamAudioVolumeChangePublisher() {
	const availableHandlers = streamAudioVolumeChangePublisher.length;
	streamAudioVolumeChangePublisher = offEvent('streamAudioVolumeChange', publisher, streamAudioVolumeChangePublisher);
	console.log('Available streamAudioVolumeChange handlers for Publisher: ' + availableHandlers + '. Remaining: ' + streamAudioVolumeChangePublisher.length);
}

function onStreamAudioVolumeChangeSubscriber() {
	const handlerNumber = streamAudioVolumeChangeSubscriber.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing streamAudioVolumeChange triggered by ' + event.target.constructor.name);
	}
	streamAudioVolumeChangeSubscriber.push(handler);
	attachHandlerHtml('streamAudioVolumeChangeSubscriber', handlerNumber, () => offEvent('streamAudioVolumeChange', subscriber, streamAudioVolumeChangeSubscriber, handler, handlerNumber));
	subscriber.on('streamAudioVolumeChange', handler);
}

function onceStreamAudioVolumeChangeSubscriber() {
	const handlerNumber = streamAudioVolumeChangeSubscriber.length + 1;
	const handler = event => {
		console.log('Handler ' + handlerNumber + ' processing streamAudioVolumeChange (ONCE) triggered by ' + event.target.constructor.name);
		streamAudioVolumeChangeSubscriber.splice(streamAudioVolumeChangeSubscriber.indexOf(handler), 1);
		removeHandlerHtml('streamAudioVolumeChangeSubscriber-handler' + handlerNumber);
	}
	streamAudioVolumeChangeSubscriber.push(handler);
	attachHandlerHtml('streamAudioVolumeChangeSubscriber', handlerNumber, () => offEvent('streamAudioVolumeChange', subscriber, streamAudioVolumeChangeSubscriber, handler, handlerNumber));
	subscriber.once('streamAudioVolumeChange', handler);
}

function offStreamAudioVolumeChangeSubscriber() {
	const availableHandlers = streamAudioVolumeChangeSubscriber.length;
	streamAudioVolumeChangeSubscriber = offEvent('streamAudioVolumeChange', subscriber, streamAudioVolumeChangeSubscriber);
	console.log('Available streamAudioVolumeChange handlers for Subscriber: ' + availableHandlers + '. Remaining: ' + streamAudioVolumeChangeSubscriber.length);
}


/**
 * --------------------------------------------
 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
 * --------------------------------------------
 * The methods below request the creation of a Session and a Token to
 * your application server. This keeps your OpenVidu deployment secure.
 * 
 * In this sample code, there is no user control at all. Anybody could
 * access your application server endpoints! In a real production
 * environment, your application server must identify the user to allow
 * access to the endpoints.
 * 
 * Visit https://docs.openvidu.io/en/stable/application-server to learn
 * more about the integration of OpenVidu in your application server.
 */

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";

function getToken(mySessionId) {
	return createSession(mySessionId).then(sessionId => createToken(sessionId));
}

function createSession(sessionId) { // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessions
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: OPENVIDU_SERVER_URL + "/openvidu/api/sessions",
			data: JSON.stringify({
				customSessionId: sessionId
			}),
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