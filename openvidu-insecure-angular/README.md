# openvidu-insecure-angular

This is the Angular version of _openvidu-insecure-js_. Try it if you plan to use Angular framework for your frontend.

## Understanding this example

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSbmtwcXNnXy1ZSkU">
</p>

OpenVidu is composed by the three modules displayed on the image above in its insecure version.

- **openvidu-browser**: NPM package for your Angular app. It allows you to manage your video-calls straight away from your clients
- **openvidu-server**: Java application that controls Kurento Media Server
- **Kurento Media Server**: server that handles low level operations of media flow transmissions

> You will only have to make use of **openvidu-browser** NPM package to get this sample app working

## Executing this example

1. Clone the repo:

	```bash
	git clone https://github.com/OpenVidu/openvidu-tutorials.git
	```
	
2. You will need angular-cli to serve the Angular frontend. You can install it with the following command:

	```bash
	npm install -g @angular/cli
	```

3. To run the sample application, execute the following command in the project:

	```bash
	cd openvidu-insecure-angular
	npm install
	ng serve
	```

4. _openvidu-server_ and _Kurento Media Server_ must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need [Docker CE](https://store.docker.com/search?type=edition&offering=community)):

	```bash
	docker run -p 8443:8443 --rm -e KMS_STUN_IP=193.147.51.12 -e KMS_STUN_PORT=3478 -e openvidu.security=false openvidu/openvidu-server-kms
	```

5. Go to [`localhost:4200`](http://localhost:4200) to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of _openvidu-server_ when you first try to join a video-call.

## Understanding the code

This is an Angular project generated with angular-cli, and therefore you will see lots of configuration files and other stuff that doesn't really matter to us. After getting `openvidu-browser` NPM package (`npm install openvidu-browser`), we will focus on the following files under `src/app/` folder:

- `app.component.ts`: AppComponent, main component of the app. It contains the functionalities for joining a video-call and for handling the video-calls themselves.
- `app.component.html`: HTML for AppComponent.
- `app.component.css`: CSS for AppComponent.
- `stream.component.css`: StreamComponent, auxiliary component to manage Stream objects on our own. It wraps the final HTML `<video>` which will display the video of its Stream property, as well as the user's nickname in a `<p>` element.

Let's see how `app.component.ts` uses `openvidu-browser`:

- First line imports the necessary objects from `openvidu-browser`:

	```typescript
	import { OpenVidu, Session, Stream } from 'openvidu-browser';
	```
- `app.component.ts` declares the following properties:

	```typescript
	// OpenVidu objects
  OV: OpenVidu;
  session: Session;

  // Streams to feed StreamComponent's
  remoteStreams: Stream[] = [];
  localStream: Stream;

  // Join form
  sessionId: string;
  token: string;
	```
	`OpenVidu` object will allow us to get a `Session` object, which is declared just after it. `remoteStreams` array will store the active streams of other users in the video-call and `localStream` will be your own local webcam stream. Finally, `sessionId` and `token` params simply represent the video-call and your participant's nickname, as you will see in a moment.

- Whenever a user clicks on the submit input defined in `app.component.html`, `joinSession()` method is called:

	```javascript
	// --- 1) Get an OpenVidu object and init a session with a sessionId ---
	
	// OpenVidu listening on "localhost:8443"
	this.OV = new OpenVidu('wss://' + location.hostname + ':8443/');

	// We will join the video-call "sessionId"
    this.session = this.OV.initSession(this.sessionId);
	```
	Since we are in a local sample app, `OV` is initialize with `localhost:8443` as its _openvidu-server_ URL. `session` is initialize with `sessionId` param: this means we will connect to `sessionId` video-call. In this case, this parameter is binded from an `<input>` element of `app.component.html`, which may be filled by the user.

	```javascript
	// --- 2) Specify the actions when events take place ---

	// On every new Stream received...
	this.session.on('streamCreated', (event) => {
	
	  // Add the new stream to 'remoteStreams' array
      this.remoteStreams.push(event.stream);
      
      // Subscribe to the Stream to receive it. Second parameter is an empty string 
      // so OpenVidu doesn't create an HTML video by its own 
      this.session.subscribe(event.stream, '');
    });

	// On every Stream destroyed...
    this.session.on('streamDestroyed', (event) => {
    
	  // Avoid OpenVidu trying to remove the HTML video element
      event.preventDefault();
      
      // Remove the stream from 'remoteStreams' array
      this.deleteRemoteStream(event.stream);
    });
	```
	Here we subscribe to the Session events that interest us. As we are using Angular framework, a good approach will be treating each Stream as a component, contained in a StreamComponent. Thus, we need to store each new stream we received in an array (`remoteStreams`), and we must remove from it every deleted stream whenever it is necessary. To achieve this, we use the following events:
	 - `streamCreated`: for each new Stream received by OpenVidu, we store it in our `remoteStreams` array and immediately subscribe to it so we can receive its video (empty string as second parameter, so OpenVidu doesn't create an HTML video on its own). HTML template of AppComponent will show the new video, as it contains an `ngFor` directive which will create a new StreamComponent for each Stream object stored in the array:

   ```html
   <div id="subscriber">
		<div *ngFor="let s of this.remoteStreams">
			<stream-component [stream]="s"></stream-component>
		</div>
	</div>
	```
	
	 - `streamDestroyed`: for each Stream that has been destroyed (which means a user has left the video-call), we remove it from `remoteStreams` array, so Angular will automatically delete the required StreamComponent from HTML. We call `event.preventDefault()` to cancel OpenVidu default behaviour towards `streamDestroyed` event, which is the deletion of the previously created HTML video element on `streamCreated` event. Because we are handling the video elements by ourselves taking advantage of Angular capabilities, we tell OpenVidu not to create them on `streamCreated` and not to delete them on `streamDestroyed`, by passing an empty string as second parameter on `Session.subscribe()` method on `streamCreated` and by calling `event.preventDefault()` on `streamDestroyed`.

- Finally connect to the session and publish your webcam:

	```javascript

	// --- 3) Connect to the session ---

	// 'token' param irrelevant when using insecure version of OpenVidu. Second param will be received by every user
	// in Stream.connection.data property, which will be appended to DOM as the user's nickname
	this.session.connect(this.token, '{"clientData": "' + this.token + '"}', (error) => {
		
      // If the connection is successful...
      if (!error) {

        // --- 4) Get your own camera stream with the desired resolution ---

		// Both audio and video will be active. HTML video element will be appended to element with 'publisher' id
		let publisher = this.OV.initPublisher('', {
			audio: true,
			video: true,
			quality: 'MEDIUM'
		});
		
		//Store your webcam stream in 'localStream' object
		this.localStream = publisher.stream;

		// --- 5) Publish your stream ---

		this.session.publish(publisher);

      } else {
        console.log('There was an error connecting to the session:', error.code, error.message);
      }
    });
	```
	
	`token` param is irrelevant when using insecure version of OpenVidu. Second parameter will supply the user's nickname showed by StreamComponent inside its `<p>` element. So in this case it is a JSON formatted string with a "clientData" tag with "token" value, which is retrieved from HTML input `<input type="text" name="token" id="token" [(ngModel)]="token" required>` (filled by the user).

	In the callback of `Session.connect` method, we check the connection has been succesful (`error` value must be _null_) and right after that we get a `Publisher` object with both audio and video activated and MEDIUM quality. We then store our local Stream (contained in `Publisher.stream` object) in `localStream` and publish the Publisher object through `Session.publish()` method. The rest of users will receive our Stream object and will execute their `streamCreated` event.
	
	With regard to our local Stream, AppComponent's HTML template has also one StreamComponent declaration ready to show our own webcam as we did with remote streams:
	```html
	<div id="publisher">
		<div *ngIf="this.localStream">
			<stream-component [stream]="this.localStream"></stream-component>
		</div>
	</div>
	```
	Last point worth considering is the `ngDoCheck()` implementation of StreamComponent. As we are handling Stream objects by ourselves (task which usually is taken care by OpenVidu), and because the URL of Stream objects takes some time to get its final value as the WebRTC negotiation takes place, we must listen to any change in `stream` @Input property. This allows us to update `videoSrc` value of the component, which finally ends up being the _src_ value of the `<video>` element. If we didn't do this, the Stream object will update its _src_ property, but our StreamComponent would keep the same initial `videoSrc` value. This ensures that all our StreamComponent's will properly display all the videos in the video-call using the correct _src_ value.
	
	```javascript
	ngDoCheck() { // Detect any change in 'stream' property
	
        // If 'src' of Stream object has changed, 'videoSrc' value must be updated
        if (!(this.videSrcUnsafe === this.stream.getVideoSrc())) {
            
            // Angular mandatory URL sanitization
            this.videoSrc = this.sanitizer.bypassSecurityTrustUrl(this.stream.getVideoSrc());
	
            // Auxiliary value to store the URL as a string for upcoming comparisons
            this.videSrcUnsafe = this.stream.getVideoSrc();
        }
    }
	```