# openvidu-insecure-js

This is the simplest demo you can try to get started with OpenVidu. It has the minimum set of features to make a video-call. You will only need a few minutes to get your first application working.

## Understanding this example

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSeVBWdkFwWEtqNjA">
</p>

OpenVidu is composed by the three modules displayed on the image above in its insecure version.

- **openvidu-browser**: JavaScript library for the browser. It allows you to manage your video-calls straight away from your clients
- **openvidu-server**: Java application that controls Kurento Media Server
- **Kurento Media Server**: server that handles low level operations of media flows transmission

> You will only have to make use of **openvidu-browser** to get this sample app working.

## Executing this example

1. Clone the repo:

	```bash
	git clone https://github.com/OpenVidu/openvidu-tutorials.git
	```

2. You will need an http web server installed in your development computer to execute the sample application. If you have _node.js_ installed, you can use [http-server](https://github.com/indexzero/http-server) to serve application files. It can be installed with:

	```bash
	npm install -g http-server
	```

3. To run the sample application, execute the following command in the project:

	```bash
	cd openvidu-insecure-js/web
	http-server
	```

4. _openvidu-server_ and _Kurento Media Server_ must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need [Docker CE](https://store.docker.com/search?type=edition&offering=community)):

	```bash
	docker run -p 8443:8443 --rm -e KMS_STUN_IP=193.147.51.12 -e KMS_STUN_PORT=3478 -e openvidu.security=false openvidu/openvidu-server-kms
	```

5. Go to [`localhost:8080`](http://localhost:8080) to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of _openvidu-server_ when you first try to join a video-call.

## Understanding the code

This application is very simple. It has only 4 files:

- `OpenVidu.js`: openvidu-browser library. You don't have to manipulate this file. 
- `app.js`: sample application main JavaScritp file, which makes use of _OpenVidu.js_. You can manipulate this file to suit your needs.
- `index.html`: HTML code for the form to connect to a video-call and for the video-call itself. You can manipulate this file to adapt it to suit your needs. 
	It has two links to both JavaScript files: 
	```html
	<script src="OpenVidu.js"></script>
	<script src="app.js"></script>
	```

- `style.css`: some CSS classes to style _index.html_. You can manipulate this file to suit your needs.

Let's see how `app.js` uses `OpenVidu.js`:

- First lines declare the two variables that will be needed in different points along the code. `OV` will be our OpenVidu object and `session` the video-call we will connect to:

	```javascript
	var OV;
	var session;
	```

- Let's initialize a new session and configure our events:

	```javascript
	OV = new OpenVidu("wss://" + location.hostname + ":8443/");
	session = OV.initSession("apikey", sessionId);
	```
	Since we are in a local sample app, `OV` object is initialize with `localhost:8443` as its _openvidu-server_ URL. `session` object is initialize with `sessionId` param: this means we will connect to `sessionId` video-call. In this case, this parameter is retrieve from HTML input 	`<input type="text" id="sessionId" required>`, which may be filled by the user.

	```javascript
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
	```
	Here we subscribe to the events that interest us. In this case, we want to receive all videos published to the video-call, as well as displaying every user's nickname nex to its video. To achieve this:
	 - `streamCreated`: for each new Stream received by OpenVidu, we immediately subscribe to it so we can see its video. A new HTML video element will be appended to element with id 'subscriber'. 
	 - `videoElementCreated`: event triggered by Subscriber object (returned by the previous `Session.subscribe` method). This allows us to add the participant nickname to the new video previously added in `streamCreated` event. Auxiliary method `appendUserData` is responsible for appending a new paragraph element just below the `event.element` video, containing `subscriber.stream.connection.data` field (which has the user's nickname).
	 - `streamDestroyed`: for each Stream that has been destroyed (which means a user has left the video-call), we remove the paragraph element with the user's nickname that we added in the previous event (`appendUserData` method created the element with an _id_ containing `event.stream.connection.connectionId` unique value, so we can now identify the right element to be removed). The video element is automatically deleted by default, so we don't need to do anything else.

- Finally connect to the session and publish your webcam:

	```javascript
	session.connect(token, '{"clientData": "' + token + '"}', function (error) {
			// If the connection is successful, initialize a publisher and publish to the session
			if (!error) {
	
				// 4) Get your own camera stream with the desired resolution and publish it, if the user is supposed to do so
	
				var publisher = OV.initPublisher('publisher', {
					audio: true,
					video: true,
					quality: 'MEDIUM'
				});
	
				// 5) Publish your stream
	
				session.publish(publisher);
	
			} else {
				console.log('There was an error connecting to the session:', error.code, error.message);
			}
		});
	```
	
	`token` param is irrelevant when using insecure version of OpenVidu. Remember `videoElementCreated` event, when we added the user's nickname to the HTML? Well, second parameter is the actual value you will receive in `Stream.connection.data` property. So in this case it is a JSON formatted string with a "clientData" tag with "token" value, which is retrieved from HTML input `<input type="text" id="participantId" required>` (filled by the user).
	
	In the callback of `Session.connect` method, we check the connection has been succesful (`error` value must be _null_) and right after that we get a `Publisher` object with both audio and video activated and MEDIUM quality. This process will end with the addition of a new HTML video element showing your camera, as a child of element with _id_ 'publisher'. We then just have to publish this object through `Session.publish` method, and the rest of users will begin receiving our webcam.