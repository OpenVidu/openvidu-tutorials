# openvidu-mvc-node


A secure OpenVidu sample app with a Node backend and a traditional MVC frontend. With regard to the use of OpenVidu, it is identical to _openvidu-js-node_. This tutorial is intended for developers who feel more comfortable with MVC web architectures for their frontends. [Embedded JavaScript](http://www.embeddedjs.com/) is the template engine of choice for this tutorial.

## Understanding this example

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSSGxqS2hYOVQzLW8">
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
	cd openvidu-mvc-node
	npm install
	node server.js localhost:8443 MY_SECRET
	```

4. _openvidu-server_ and _Kurento Media Server_ must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need [Docker CE](https://store.docker.com/search?type=edition&offering=community)):

	```bash
	docker run -p 8443:8443 --rm -e KMS_STUN_IP=193.147.51.12 -e KMS_STUN_PORT=3478 -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms
	```

5. Go to [`https://localhost:5000`](https://localhost:5000) to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of _openvidu-server_ when you first try to join a video-call. To test two users in the same computer, use a standard window and an incognito window.

## Understanding the code

This is a very basic web application with a pretty simple vanilla JS/HTML/CSS frontend and a straightforward Node backend built with [_express_](http://expressjs.com) that serves HTML files with a MVC approach, building the templates with the help of [Embedded JavaScript](http://www.embeddedjs.com/).

OpenVidu assumes you can identify your users so you can tell which users can connect to which video-calls, and what role (and therefore what permissions) each one of them will have in the calls. You can do this as you prefer. Here our backend will manage the users and their sessions with the easy-to-use and non-intrusive [_express-session_](https://github.com/expressjs/session) API.

- **Backend**: node server
	- `server.js` : single file which handles all operations of server. It returns HTML templates as response to HTTP requests.

- **Frontend templates**: Pure JS/HTML/CSS files served by the backend, with `.ejs` extension to support Embedded JavaScript (`/views` folder)
	- `index.ejs` : template with the login form
	- `dashboard.ejs` : template with the form to join a video-call
	- `session.ejs` : template of the video-call itself

- **Frontend static files** (`/public` folder)
 	- `OpenVidu.js` : openvidu-browser library. You don't have to manipulate this file
	- `style.css` : some CSS classes to style the templates


Let's describe the code following this scenario: a user logs in to the app and connects to the video-call "TUTORIAL", where he publishes his webcam. A second user will connect to the same video-call just after that and publish its own webcam. Both of them will leave the call after a while.

---

### 1) User logs in

At path `/` a login form will be displayed:

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSMlh0QkZoYmpQMkE">
</p>

The form will execute a POST operation to path `/dashboard` whenever "Log in" button is clicked, passing the username and the password:

```html
<form action="/dashboard" method="post">
	<p>
		<label>User</label> <input type="text" name="user" required="true"></input>
	</p>
	<p>
		<label>Pass</label> <input type="password" name="pass" required="true"></input>
	</p>
	<p>
		<button type="submit">Log in</button>
	</p>
</form>
```

`server.js` at `/dashboard` first checks if the user is already logged (maybe he has just refreshed `/dashboard` page), and if so it just redirects to the dashboard itself. If the user is actually logging in, the method checks that the params are correct and if so sets a new _express-session_ for the newly logged user (adding a _loggedUser_ property with its username in the _req.session_ object). Finally it returns `dashboard.ejs` template:

```javascript
app.post('/dashboard', dashboardController);
app.get('/dashboard', dashboardController);

function dashboardController(req, res) {

	// Check if the user is already logged in
	if (isLogged(req.session)) {
		// User is already logged. Immediately return dashboard
		user = req.session.loggedUser;
		res.render('dashboard.ejs', {
			user: user
		});
	} else {
		// User wasn't logged and wants to
		
		// Retrieve params from POST body
		var user = req.body.user;
		var pass = req.body.pass;
		
		if (login(user, pass)) { // Correct user-pass
			// Validate session and return OK 
			// Value stored in req.session allows us to identify the user in future requests
	    	req.session.loggedUser = user;
			res.render('dashboard.ejs', {
				user: user
			});
		} else { // Wrong user-pass
			// Invalidate session and return index template
			req.session.destroy();
			res.redirect('/');
		}
	}
}
``` 

---

### 2) User connects to "TUTORIAL" video-call

`dashboard.html` template will display a form asking for the video-call to connect and the nickname the user wants to have in it. So our 'publisher1' user would write TUTORIAL in "Session" field:

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSWkJsOFltSXhYbmc">
</p>

The form will execute a POST operation to path `/session` whenever "Join!" button is clicked, passing the nickname and the session name:

```html
<form action="/session" method="post">
	<p>
		<label>Name: </label> <input name="data" required="true"></input>
	</p>
	<p>
		<label>Session: </label> <input name="sessionname" required="true"></input>
	</p>
	<p>
		<button type="submit">Join!</button>
	</p>
</form>
```

When `server.js` receives a request at `/session` path is when things get interesting.
First of all there are some important attributes in this class we must mention:

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

Rest controller method receives both params sent by the client (whatever nickname the user has chosen and "TUTORIAL" as the sessionName). First it prepares a param we will need a little further on: `tokenOptions`.

```javascript
app.post('/session', (req, res) => {
// Check the user is logged ... 

// The nickname sent by the client
var clientData = req.body.data;
// The video-call to connect ("TUTORIAL")
var sessionName = req.body.sessionname;

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
			
			// Return session template with all the needed attributes
			res.render('session.ejs', {
				sessionId: sessionId,
				token: token,
				nickName: clientData,
				userName: req.session.loggedUser,
				sessionName: sessionName
			});
		});
	});
}
```
We are almost there! Now in `session.html` JavaScript code (preceded by a tag `<script>`) we can init a new Session with _sessionId_ and connect to it with _token_:
```javascript
// Get all the attributes from the template in EJS style
var sessionId = <%- JSON.stringify(sessionId) %>;
var token = <%- JSON.stringify(token) %>;
var nickName = <%- JSON.stringify(nickName) %>;
var userName = <%- JSON.stringify(userName) %>;
var sessionName = <%- JSON.stringify(sessionName) %>;

// --- 1) Get an OpenVidu object and init a session with the retrieved sessionId ---

var OV = new OpenVidu();
var session = OV.initSession(sessionId);


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

session.connect(token, '{"clientData": "' + nickName + '"}', function (err) {

	// If the connection is successful, initialize a publisher and publish to the session
	if (!err) {

		// Here we check somehow if the user has at least 'PUBLISHER' role before
		// trying to publish its stream. Even if someone modified the client's code and
		// published the stream, it wouldn't work if the token sent in Session.connect
		// method doesn't belong to a 'PUBLIHSER' role
		if (isPublisher(userName)) {

			// --- 4) Get your own camera stream ---
			
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
		
		// Return session template with all the needed attributes
		res.render('session.ejs', {
			sessionId: sessionId,
			token: token,
			nickName: clientData,
			userName: req.session.loggedUser,
			sessionName: sessionName
		});
	});
}
```
The code executed in `session.html` _< script >_ tag would also be the same. After the `Session.publish()` method has been succesful, both users will be seeing each other's video, as well as the username and the nickname below it.

---

### 4) Users leave the video-call

After a while both users decide to leave the session. Apart from calling `session.disconnect()` (triggered in `leaveSession()` _onclick_ method) to destroy the connection on openvidu-server, we need another POST operation to let the backend know that certain user has left the session so it can update the collections with the active sessions and tokens.

In `session.html` template the "Leave session" button actually performs a POST operation to path `/leave-session` with a hidden form. Notice that when the user clicks the submit button, a POST operation will be triggered but also the `leaveSession()` method. First updates our backend. Second updates our openvidu-server.

```html
<form action="/leave-session" method="post">
	<input type="hidden" name="session-name" th:value="${sessionName}"></input>
	<input type="hidden" name="token" th:value="${token}"></input>
	<button type="submit" onclick="leaveSession()">Leave session</button>
</form>
```

In `server.js` we update the collections at `/leave-session`:

```javascript
app.post('/leave-session', function (req, res) {
	// Check the user is logged ...
	
	// Retrieve params from POST body
	var sessionName = req.body.sessionname;
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
			res.redirect('/dashboard');
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