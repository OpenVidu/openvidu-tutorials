# openvidu-js-node

A secure OpenVidu sample app with a Node backend and a SPA frontend. It makes use of the _openvidu-node-client_ to get the necessary params from OpenVidu Server.

## Understanding this example

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSVkNVZ2s3cmk2aHM">
</p>

OpenVidu is composed by the modules displayed on the image above.

- **openvidu-browser**: JavaScript library for the browser. It allows you to manage your video-calls straight away from your clients
- **openvidu-node-client**: NPM package to easily get the necessary params (sessionId's and tokens) from openvidu-server. Quick alternative to REST API
- **openvidu-server**: Java application that controls Kurento Media Server
- **Kurento Media Server**: server that handles low level operations of media flow transmissions

> You will only have to make use of **openvidu-browser** and **openvidu-node-client** to get this sample app working

## Executing this example

1. Clone the repo:

	```bash
	git clone https://github.com/OpenVidu/openvidu-tutorials.git
	```
	
2. You will need _node_ and _NPM_ to execute the app. You can install them with:

	```bash
	sudo apt-get install nodejs
	sudo apt-get install npm
	```

3. To run the sample application, execute the following commands in the project. They will install the NPM dependencies and will execute `server.js` server passing two arguments: "localhost:8443" as the URL where _openvidu-server_ will be listening and "MY_SECRET" as the secret share with it:

	```bash
	cd openvidu-js-node
	npm install
	node server.js localhost:8443 MY_SECRET
	```

4. _openvidu-server_ and _Kurento Media Server_ must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need [Docker CE](https://store.docker.com/search?type=edition&offering=community)):

	```bash
	docker run -p 8443:8443 --rm -e KMS_STUN_IP=193.147.51.12 -e KMS_STUN_PORT=3478 -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms
	```

5. Go to [`https://localhost:5000`](https://localhost:5000) to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of _openvidu-server_ when you first try to join a video-call. To test two users in the same computer, use a standard window and an incognito window.

## Understanding the code

This is a very basic web application with a pretty simple vanilla JS/HTML/CSS frontend and a straightforward Node backend with [_express_](http://expressjs.com/es/). OpenVidu assumes you can identify your users so you can tell which users can connect to which video-calls, and what role (and therefore what permissions) each one of them will have in the calls. You can do this as you prefer. Here our backend will manage the users and their sessions with the easy-to-use and non-intrusive [_express-session_](https://github.com/expressjs/session) API.

- **Backend**: node server
	- `server.js` : single file which handles all operations of server.

- **Frontend**: Pure JS/HTML/CSS files (`/public` folder)
	- `OpenVidu.js` : openvidu-browser library. You don't have to manipulate this file. 
	- `app.js` : sample application main JavaScritp file, which makes use of _OpenVidu.js_.
	- `index.html` : HTML code for the form to login, the form to connect to a video-call and for the video-call itself.
		It has two links to both JavaScript files: 
		```html
		<script src="OpenVidu.js"></script>
		<script src="app.js"></script>
		```
	
	- `style.css`: some CSS classes to style _index.html_.


Let's describe the code following this scenario: a user logs in to the app and connects to the video-call "TUTORIAL", where he publishes his webcam. A second user will connect to the same video-call just after that and publish its own webcam. Both of them will leave the call after a while.

---

### 1) User logs in

We have implemented a method for making HTTP requests to the backend, as we will need to 	make at least three of them: one for logging in, one for getting the sessionId and a valid token from openvidu-server and a one for letting know our backend when any user leaves the video-call. The header of the method looks like this:

```javascript
function httpRequest(method, url, body, errorMsg, callback)
```

Where `method` is whether "POST" or "GET", `url` the path of the REST operation, `body` the data to be passed, `errorMsg` the output error message if something goes wrong and `callback` the function to execute in case of success. As mentioned above, we need to call this method three times for each user that LOGS IN 🡒 CONNECTS TO A VIDEO-CALL 🡒 LEAVES THE VIDEO-CALL.

`index.html` will first show a form to log in:

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSMlh0QkZoYmpQMkE">
</p>

`app.js` sends an HTTP request to "/api-login/login" passing the username and the password retrieved from the HTML form whenever "Log in" button is clicked:

```javascript
function logIn() {
	var user = $("#user").val(); // Username
	var pass = $("#pass").val(); // Password
	var jsonBody = JSON.stringify({ // Body of POST request
		'user': user,
		'pass': pass
	});

	httpRequest('POST', '/api-login/login', jsonBody, 'Login WRONG',
	  function successCallback(response){ // Send POST request
		console.warn(userName + ' login');
		// HTML shows logged-in page ...
	});
}
```

`server.js` at `/api-login/login` checks the params are correct and if so sets an active session for the newly logged user (adding a _loggedUser_ property with its username in the _req.session_ object):

```javascript
app.post('/api-login/login', function (req, res) {
    
    // Retrieve params from POST body
    var user = req.body.user;
    var pass = req.body.pass;

    if (login(user, pass)) { // Correct user-pass
        // Validate session and return OK 
        // Value stored in req.session allows us to identify the user in future requests
        req.session.loggedUser = user;
        res.status(200).send();
    } else { // Wrong user-pass
        // Invalidate session and return error
        req.session.destroy();
        res.status(401).send('User/Pass incorrect');
    }
});
```

---

### 2) User connects to "TUTORIAL" video-call

HTML will display now the user has logged in a different form, asking for the video-call to connect and the nickname the user wants to have in it. So our 'publisher1' user would write TUTORIAL in "Session" field and press "Join!" button:

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSWkJsOFltSXhYbmc">
</p>

`app.js` will execute `joinSession()` method, which starts like this:

```javascript
function joinSession() {
	getSessionIdAndToken(function () { ...
```
So the first thing to do here is to retrieve a _sessionId_ and a _token_ from our backend. Only when we have them available in the browser we will continue with the _join_ operation. Let's see what `getSessionIdAndToken()` looks like:

```javascript
function getSessionIdAndToken(callback) {
	sessionName = $("#sessionName").val(); // Video-call to connect ("TUTORIAL")
	var jsonBody = JSON.stringify({ // Body of POST request
		'session': sessionName
	});

	// Send POST request
	httpRequest('POST', '/api-sessions/get-sessionid-token', jsonBody, 
	 'Request of SESSIONID and TOKEN gone WRONG:', function successCallback(response){
		sessionId = response[0]; // Get sessionId from response
		token = response[1]; // Get token from response
		callback(); // Continue the join operation
	});
}
```
Here is the second time we must call our `httpRequest()` method, sending the session we want to connect ("TUTORIAL") and waiting to get a _sessionId_ and a _token_ as response. The interesting part here is in `server.js` controller at `/api-sessions/get-sessionid-token`. First of all there are some important attributes in this class we must mention:

```javascript
// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = process.argv[2];
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = process.argv[3];

// OpenVidu object to ask openvidu-server for sessionId and token
var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

// Collection to pair session names and OpenVidu Session objects
var mapSessionNameSession = {};
// Collection to pair sessionId's (identifiers of Session objects) and tokens
var mapSessionIdTokens = {};
```

Rest controller method begins retrieving the param send by the client, which in this case is the video-call name ("TUTORIAL"), as well as preparing a param we will need a little further on: `tokenOptions`.


```javascript
app.post('/api-sessions/get-sessionid-token', function (req, res) {
	// Check the user is logged ... 

	// The video-call to connect ("TUTORIAL")
	var sessionName = req.body.session;

	// Role associated to this user
	var role = users.find(u => (u.user === req.session.loggedUser)).role;

	// Optional data to be passed to other users when this user connects to the video-call
	// In this case, a JSON with the value we stored in the req.session object on login
	var serverData = '{"serverData": "' + req.session.loggedUser + '"}';

	// Build tokenOptions object with the serverData and the role
	var tokenOptions = new TokenOptions.Builder()
           .data(serverData)
           .role(role)
           .build();
```

Just after that an _if-else_ statement comes into play: does the session "TUTORIAL" already exitsts? 
```javascript
if (mapSessionNameSession[sessionName]) { ...
```
In this case it doesn't because 'publisher1' is the first user connecting to it. So we focus on the _else_ branch:

```javascript
else { // New session: return a new sessionId and a new token
	// Create a new OpenVidu Session
	var mySession = OV.createSession();
	
	// Get the sessionId asynchronously
	mySession.getSessionId(function (sessionId) {
		
		// Store the new Session in the collection of Sessions
		mapSessionNameSession[sessionName] = mySession;
		// Store a new empty array in the collection of tokens
		mapSessionIdTokens[sessionId] = [];
		
		// Generate a new token asynchronously with the recently created tokenOptions
		mySession.generateToken(tokenOptions, function (token) {
			
			// Store the new token in the collection of tokens
			mapSessionIdTokens[sessionId].push(token);
			
			// Return the sessionId and token to the client
			res.status(200).send({
				0: sessionId,
				1: token
			});
		});
	});
}
```
We are almost there! Now in `app.js` we can init a new Session with _sessionId_ and connect to it with _token_:

```javascript
// --- 1) Get an OpenVidu object and init a session with the retrieved sessionId ---

OV = new OpenVidu();
session = OV.initSession(sessionId);


// --- 2) Specify the actions when events take place ---

// On every new Stream received...
session.on('streamCreated', function (event) {

	// Subscribe to the Stream to receive it
	// HTML video will be appended to element with 'subscriber' id
	var subscriber = session.subscribe(event.stream, 'subscriber');
	
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

session.connect(token, '{"clientData": "' + $("#participantName").val() + '"}', function (err) {

	// If the connection is successful, initialize a publisher and publish to the session
	if (!err) {

		// Here we check somehow if the user has at least 'PUBLISHER' role before
		// trying to publish its stream. Even if someone modified the client's code and
		// published the stream, it won't work if the token sent in Session.connect
		// method doesn't belong to a 'PUBLIHSER' role
		if (isPublisher()) {

			// --- 4) Get your own camera stream and publish it ---

			var publisher = OV.initPublisher('publisher', {
				audio: true,
				video: true,
				quality: 'MEDIUM'
			});


			// --- 5) Publish your stream ---

			session.publish(publisher);

		} else {
			console.warn('You don\'t have permissions to publish');
		}
	} else {
		console.warn('Error connecting to the session:', error.code, error.message);
	}
	
	// HTML shows session page ...
	
});
```
The user will now see its own video on the page. The connection to the session has completed!

---

### 3) Another user connects to the video-call

The process would be exactly the same as before until `server.js` executes controller at `/api-sessions/get-sessionid-token`. Now session 'TUTORIAL' already exists, so in the _if-else_ statement the _if_ branch would be the one executed:

```javascript
if (mapSessionNameSession[sessionName]) {
	// Session already exists: return existing sessionId and a new token
	
	// Get the existing Session from the collection
	var mySession = mapSessionNameSession[sessionName];
	
	// Generate a new token asynchronously with the recently created tokenOptions
	mySession.generateToken(tokenOptions, function (token) {
		
		// Get the existing sessionId
		var sessionId = mySession.getSessionId();
		
		// Store the new token in the collection of tokens
		mapSessionIdTokens[sessionId].push(token);
		
		// Return the sessionId and token to the client
		res.status(200).send({
			0: sessionId,
			1: token
		});
	});
}
```
The code executed in `app.js` would also be the same. After the `Session.publish()` method has been succesful, both users will be seeing each other's video, as well as the username and the nickname below it.

---

### 4) Users leave the video-call

After a while both users decide to leave the session. Apart from calling `leaveSession()` (and therefore `session.disconnect()`) to destroy the connection on openvidu-server, we need to run the last HTTP operation: we must let the backend know that certain user has left the session so it can update the collections with the active sessions and tokens. To sum up, `session.disconnect()` updates our openvidu-server and the POST operation updates our backend.
For the POST operation, in `app.js` we run:

```javascript
function removeUser() {
	// Body of POST request with the name of the session and the token of the leaving user
	var jsonBody = JSON.stringify({
		'sessionName': sessionName,
		'token': token
	});

	// Send POST request
	httpRequest('POST', '/api-sessions/remove-user', jsonBody,
		'User couldn\'t be removed from session', function successCallback(response) {
		console.warn(userName + ' correctly removed from session ' + sessionName);
	});
}
``` 
And in `server.js` we update the collections in `/api-sessions/remove-user`:

```javascript
app.post('/api-sessions/remove-user', function (req, res) {
	// Check the user is logged ...
	
	// Retrieve params from POST body
	var sessionName = req.body.sessionName;
	var token = req.body.token;
	
	// If the session exists ("TUTORIAL" in this case)
	var mySession = mapSessionNameSession[sessionName];
	if (mySession) {
		var tokens = mapSessionIdTokens[mySession.getSessionId()];
		if (tokens) {
			var index = tokens.indexOf(token);
			
			// If the token exists
			if (index !== -1) {
				// Token removed!
				tokens.splice(index, 1);
			} else {
				res.status(500).send('The TOKEN wasn\'t valid');
			}
			if (mapSessionIdTokens[mySession.getSessionId()].length == 0) {
				// Last user left: session "TUTORIAL" must be removed
				delete mapSessionNameSession[sessionName];
			}
			res.status(200).send();
		} else {
			res.status(500).send('The SESSIONID wasn\'t valid');
		}
	} else {
		res.status(500).send('The SESSION does not exist');
	}
}
```
When the last user leaves the session `delete mapSessionNameSession[sessionName]` will be executed: this means the session is empty and that it is going to be closed. The _sessionId_ and all _token_ params associated to it will be invalidated.

---

> At this point we have covered all the important code from the tutorial. With this scenario we have seen the most common use-case, but you can modify whatever you want to suit your needs. And remember that this is just one of the many possible approaches: **you can implement your frontend and your backend as you want**. 
> 
> The only actual requirements are getting ***sessionId*** and ***token*** params from  ***openvidu-server*** (by using one of the available clients or with the REST API) and using them along with ***openvidu-browser*** to connect your clients to the sessions.