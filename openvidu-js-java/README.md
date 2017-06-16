# openvidu-js-java

A secure OpenVidu sample app with a Java backend and a SPA frontend. It makes use of _openvidu-java-client_ to get the necessary params from OpenVidu Server.

## Understanding this example

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWScllLNlZTLVBTaUU">
</p>

OpenVidu is composed by the modules displayed on the image above.

- **openvidu-browser**: JavaScript library for the browser. It allows you to manage your video-calls straight away from your clients
- **openvidu-java-client**: Java package to easily get the necessary params (sessionId's and tokens) from openvidu-server. Quick alternative to REST API
- **openvidu-server**: Java application that controls Kurento Media Server
- **Kurento Media Server**: server that handles low level operations of media flow transmissions

> You will only have to make use of **openvidu-browser** and **openvidu-java-client** to get this sample app working

## Executing this example

1. Clone the repo:

	```bash
	git clone https://github.com/OpenVidu/openvidu-tutorials.git
	```
	
2. You will need _maven_ to build the project. You can install it with:

	```bash
	sudo apt-get install maven
	```

3. To run the sample application, execute the following command in the project:

	```bash
	cd openvidu-js-java
	mvn package exec:java
	```

4. _openvidu-server_ and _Kurento Media Server_ must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need [Docker CE](https://store.docker.com/search?type=edition&offering=community)):

	```bash
	docker run -p 8443:8443 --rm -e KMS_STUN_IP=193.147.51.12 -e KMS_STUN_PORT=3478 -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms
	```

5. Go to [`https://localhost:5000`](https://localhost:5000) to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of _openvidu-server_ when you first try to join a video-call. To test two users in the same computer, use a standard window and an incognito window.

## Understanding the code

This is a very basic web application with a pretty simple vanilla JS/HTML/CSS frontend and a straightforward Java backend. OpenVidu assumes you can identify your users so you can tell which users can connect to which video-calls, and what role (and therefore what permissions) each one of them will have in the calls. You can do this as you prefer. Here our backend will manage the users and their sessions with the easy-to-use and non-intrusive _HttpSession_ API. In these posts multiple options for user session management in Java are explained, inlcuding the one used in this tutorial: [journaldev.com](http://www.journaldev.com/1907/java-session-management-servlet-httpsession-url-rewriting), [studytonight.com](http://www.studytonight.com/servlet/session-management.php).

- Backend: SpringBoot app with the following classes (`src/main/java` path, `io.openvidu.js.java` package)
	- `App.java` : entrypoint for the app
	- `LoginController.java` : rest controller for handling login and logout operations
	- `SessionController.java` : rest controller for getting sessionId's and tokens. It also stores our active video-calls and the users connected to them

- Frontend: Pure JS/HTML/CSS files (`src/main/resources/static`)
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

### 1)  User logs in

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

`LoginController.java` checks the params are correct and if so sets an _HttpSession_ for the newly logged user (adding a "loggedUser" attribute with its username in the HttpSession object):

```java
@RequestMapping(value = "/api-login/login", method = RequestMethod.POST)
public ResponseEntity<Object> login(@RequestBody String userPass, HttpSession httpSession) 
					throws ParseException {

	// Retrieve params from POST body
	JSONObject userPassJson = (JSONObject) new JSONParser().parse(userPass);
	String user = (String) userPassJson.get("user");
	String pass = (String) userPassJson.get("pass");

	if (login(user, pass)){ // Correct user-pass
		// Validate session and return OK 
		// Value stored in HttpSession allows us to identify the user in future requests
		httpSession.setAttribute("loggedUser", user);
		return new ResponseEntity<>(HttpStatus.OK);
	} else { // Wrong user-pass
		// Invalidate session and return error
		httpSession.invalidate();
		return new ResponseEntity<>("User/Pass incorrect", HttpStatus.UNAUTHORIZED);
	}
}
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
Here is the second time we must call our `httpRequest()` method, sending the session we want to connect ("TUTORIAL") and waiting to get a _sessionId_ and a _token_ as response. The interesting part here is in `SessionController.java`. First of all there are some important attributes in this class we must mention:

```java
// OpenVidu object to ask openvidu-server for sessionId and token
private OpenVidu openVidu;

// Collection to pair session names and OpenVidu Session objects
private Map<String, Session> mapSessions = new ConcurrentHashMap<>();
// Collection to pair sessionId's and tokens (the inner Map pairs tokens and role associated)
private Map<String, Map<String, OpenViduRole>> mapSessionIdsTokens = new ConcurrentHashMap<>();

// URL where our OpenVidu server is listening
private String OPENVIDU_URL;
// Secret shared with our OpenVidu server
private String SECRET;
```

Rest controller method begins retrieving the param send by the client, which in this case is the video-call name ("TUTORIAL"), as well as preparing a param we will need a little further on: `tokenOptions`.

```java
@RequestMapping(value = "/api-sessions/get-sessionid-token", method = RequestMethod.POST)
public ResponseEntity<JSONObject> getSessionIdToken(@RequestBody String sessionNameParam, 
		HttpSession httpSession) throws ParseException {
	// Check the user is logged ... 

	JSONObject sessionJSON = (JSONObject) new JSONParser().parse(sessionNameParam);
	
	// The video-call to connect ("TUTORIAL")
	String sessionName = (String) sessionJSON.get("session");
	
	// Role associated to this user
	OpenViduRole role = LoginController.users.get(httpSession.getAttribute("loggedUser")).role;
	
	// Optional data to be passed to other users when this user connects to the video-call
	// In this case, a JSON with the value we stored in the HttpSession object on login
	String serverData = "{\"serverData\": \"" + httpSession.getAttribute("loggedUser") + "\"}";

	// Build tokenOptions object with the serverData and the role
	TokenOptions tokenOptions = new TokenOptions.Builder().data(serverData).role(role).build();

	JSONObject responseJson = new JSONObject();
```

Just after that an _if-else_ statement comes into play: does the session "TUTORIAL" already exitsts? 
```java
if (this.mapSessions.get(sessionName) != null) { ...
```
In this case it doesn't because 'publisher1' is the first user connecting to it. So we focus on the _else_ branch:

```java
else {
	// New session: return a new sessionId and a new token
	try {
	
		// Create a new OpenVidu Session
		Session session = this.openVidu.createSession();
		// Get the sessionId
		String sessionId = session.getSessionId();
		// Generate a new token with the recently created tokenOptions
		String token = session.generateToken(tokenOptions);

		// Store the session and the token in our collections
		this.mapSessions.put(sessionName, session);
		this.mapSessionIdsTokens.put(sessionId, new ConcurrentHashMap<>());
		this.mapSessionIdsTokens.get(sessionId).put(token, OpenViduRole.PUBLISHER);

		// Prepare the response with the sessionId and the token
		responseJson.put(0, sessionId);
		responseJson.put(1, token);

		// Return the response to the client
		return new ResponseEntity<>(responseJson, HttpStatus.OK);
		
	} catch (Exception e) {
		// If error generate an error message and return it to client
		return getErrorResponse(e);
	}
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

The process would be exactly the same as before until `SessionController.java` executes `getSessionIdAndToken()` method. Now session 'TUTORIAL' already exists, so in the _if-else_ statement the _if_ branch would be the one executed:

```java
if (this.mapSessions.get(sessionName) != null) {
	// Session already exists: return existing sessionId and a new token
	try {
	
		// Get the existing sessionId from our collection with 
		// the sessionName param ("TUTORIAL")
		String sessionId = this.mapSessions.get(sessionName).getSessionId();
		// Generate a new token with the recently created tokenOptions
		String token = this.mapSessions.get(sessionName).generateToken(tokenOptions);
		
		// Update our collection storing the new token
		this.mapSessionIdsTokens.get(sessionId).put(token, OpenViduRole.PUBLISHER);
		
		// Prepare the response with the sessionId and the token
		responseJson.put(0, sessionId);
		responseJson.put(1, token);
		
		// Return the response to the client
		return new ResponseEntity<>(responseJson, HttpStatus.OK);
		
	} catch (Exception e) {
		// If error generate an error message and return it to client
		return getErrorResponse(e);
	}
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
And in `SessionController.java` we update the collections:

```java
@RequestMapping(value = "/api-sessions/remove-user", method = RequestMethod.POST)
public ResponseEntity<JSONObject> removeUser(@RequestBody String sessionNameToken, 
	HttpSession httpSession) throws Exception {
	// Check the user is logged ... 

	// Retrieve the params from BODY
	JSONObject sessionNameTokenJSON = (JSONObject) new JSONParser().parse(sessionNameToken);
	String sessionName = (String) sessionNameTokenJSON.get("sessionName");
	String token = (String) sessionNameTokenJSON.get("token");

	// If the session exists ("TUTORIAL" in this case)
	if (this.mapSessions.get(sessionName) != null) {
		String sessionId = this.mapSessions.get(sessionName).getSessionId();

		if (this.mapSessionIdsTokens.containsKey(sessionId)) {
			// If the token exists
			if (this.mapSessionIdsTokens.get(sessionId).remove(token) != null) {
				// Token has been removed
				if (this.mapSessionIdsTokens.get(sessionId).isEmpty()) {
					// Last user left: session "TUTORIAL" must be removed
					this.mapSessions.remove(sessionName);
				}
				return new ResponseEntity<>(HttpStatus.OK);
			} else {
				// The TOKEN wasn't valid
				return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
			}
		} else {
			// The SESSIONID wasn't valid
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	} else {
		// The SESSION does not exist
		return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
```
When the last user leaves the session `this.mapSessions.remove(sessionName);` will be executed: this means the session is empty and that it is going to be closed. The _sessionId_ and all _token_ params associated to it will be invalidated.

---

> At this point we have covered all the important code from the tutorial. With this scenario we have seen the most common use-case, but you can modify whatever you want to suit your needs. And remember that this is just one of the many possible approaches: **you can implement your frontend and your backend as you want**. 
> 
> The only actual requirements are getting ***sessionId*** and ***token*** params from  ***openvidu-server*** (by using one of the available clients or with the REST API) and using them along with ***openvidu-browser*** to connect your clients to the sessions.