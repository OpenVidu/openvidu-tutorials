# openvidu-mvc-java

A secure OpenVidu sample app with a Java backend and a traditional MVC frontend. With regard to the use of OpenVidu, it is identical to [openvidu-js-java](https://github.com/OpenVidu/openvidu-tutorials/tree/master/openvidu-js-java). This tutorial is intended for developers who feel more comfortable with MVC web architectures for their frontends. [Thymeleaf](http://www.thymeleaf.org/) is the template engine of choice for this tutorial.

## Understanding this example

<p align="center">
  <img src="https://docs.google.com/uc?id=0B61cQ4sbhmWSQzJGRDhzS1dNZFk">
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
	cd openvidu-mvc-java
	mvn package exec:java
	```

4. _openvidu-server_ and _Kurento Media Server_ must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need [Docker CE](https://store.docker.com/search?type=edition&offering=community)):

	```bash
	docker run -p 8443:8443 --rm -e KMS_STUN_IP=193.147.51.12 -e KMS_STUN_PORT=3478 -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms
	```

5. Go to [`https://localhost:5000`](https://localhost:5000) to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of _openvidu-server_ when you first try to join a video-call. To test two users in the same computer, use a standard window and an incognito window.

## Understanding the code

This is a very basic web application with a pretty simple vanilla JS/HTML/CSS frontend and a straightforward Java backend that serves HTML files with a MVC approach, building the templates with the help of [Thymeleaf](http://www.thymeleaf.org/).

OpenVidu assumes you can identify your users so you can tell which users can connect to which video-calls, and what role (and therefore what permissions) each one of them will have in the calls. You can do this as you prefer. Here our backend will manage the users and their sessions with the easy-to-use and non-intrusive _HttpSession_ API. In these posts multiple options for user session management in Java are explained, inlcuding the one used in this tutorial: [journaldev.com](http://www.journaldev.com/1907/java-session-management-servlet-httpsession-url-rewriting), [studytonight.com](http://www.studytonight.com/servlet/session-management.php).

- **Backend**: SpringBoot app with the following classes (`src/main/java` path, `io.openvidu.js.java` package)
	- `App.java` : entrypoint for the app
	- `LoginController.java` : controller for handling login and logout operations
	- `SessionController.java` : controller for getting sessionId's and tokens. It also stores our active video-calls and the users connected to them

- **Frontend templates**: Pure JS/HTML/CSS files served by the backend (`src/main/resources/templates`)
	- `index.html` : template with the login form
	- `dashboard.html` : template with the form to join a video-call
	- `session.html` : template of the video-call itself

- **Frontend static files** (`src/main/resources/static`)
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

`LoginController.java` first checks if the user is already logged (maybe he has just refreshed `/dashboard` page), and if so it just redirects to the dashboard itself. If the user is actually logging in, the method checks that the params are correct and if so sets an _HttpSession_ for the newly logged user (adding a "loggedUser" attribute with its username in the HttpSession object). Finally it returns `dashboard.html` template:

```java
@RequestMapping(value = "/dashboard", method = { RequestMethod.GET, RequestMethod.POST })
public String login(@RequestParam(name = "user", required = false) String user,
		    @RequestParam(name = "pass", required = false) String pass,
		    Model model, HttpSession httpSession) {

	// Check if the user is already logged in
	String userName = (String) httpSession.getAttribute("loggedUser");
	if (userName != null) { 
		// User is already logged. Immediately return dashboard
		model.addAttribute("username", userName);
		return "dashboard";
	}
	
	// User wasn't logged and wants to
	if (login(user, pass)) { // Correct user-pass
		
		// Validate session and return OK 
		// Value stored in HttpSession allows us to identify the user in future requests
		httpSession.setAttribute("loggedUser", user);
		model.addAttribute("username", user);
		
		// Return dashboard.html template
		return "dashboard";
		
	} else { // Wrong user-pass
		// Invalidate session and redirect to index.html
		httpSession.invalidate();
		return "redirect:/";
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
		<label>Session: </label> <input name="session-name" required="true"></input>
	</p>
	<p>
		<button type="submit">Join!</button>
	</p>
</form>
```

When `SessionController.java` receives a request at `/session` path is when things get interesting.
First of all there are some important attributes in this class we must mention:

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

Rest controller method receives both params sent by the client (whatever nickname the user has chosen and "TUTORIAL" as the sessionName). First it prepares a param we will need a little further on: `tokenOptions`.

```java
@RequestMapping(value = "/session", method = RequestMethod.POST)
public String joinSession(@RequestParam(name = "data") String clientData,
			  @RequestParam(name = "session-name") String sessionName, 
			  Model model, HttpSession httpSession) {
	// Check the user is logged ... 
	
	// Role associated to this user
	OpenViduRole role = LoginController.users.get(httpSession.getAttribute("loggedUser")).role;
	
	// Optional data to be passed to other users when this user connects to the video-call
	// In this case, a JSON with the value we stored in the HttpSession object on login
	String serverData = "{\"serverData\": \"" + httpSession.getAttribute("loggedUser") + "\"}";

	// Build tokenOptions object with the serverData and the role
	TokenOptions tokenOptions = new TokenOptions.Builder().data(serverData).role(role).build();
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

		// Add all the needed attributes to the template
		model.addAttribute("sessionId", sessionId);
		model.addAttribute("token", token);
		model.addAttribute("nickName", clientData);
		model.addAttribute("userName", httpSession.getAttribute("loggedUser"));
		model.addAttribute("sessionName", sessionName);

		// Return session.html template
		return "session";
		
	} catch (Exception e) {
		// If error just return dashboard.html template
		model.addAttribute("username", httpSession.getAttribute("loggedUser"));
		return "dashboard";
	}
}
```
We are almost there! Now in `session.html` JavaScript code (preceded by a tag `<script th:inline="javascript">`) we can init a new Session with _sessionId_ and connect to it with _token_:
```javascript
// Get all the attributes from the template in Thymeleaf style
var sessionId = [[${sessionId}]];
var token = [[${token}]];
var nickName = [[${nickName}]];
var userName = [[${userName}]];
var sessionName = [[${sessionName}]];

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
		// published the stream, it won't work if the token sent in Session.connect
		// method doesn't belong to a 'PUBLIHSER' role
		if (isPublisher(userName)) {

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

		// Add all the needed attributes to the template
		model.addAttribute("sessionId", sessionId);
		model.addAttribute("token", token);
		model.addAttribute("nickName", clientData);
		model.addAttribute("userName", httpSession.getAttribute("loggedUser"));
		model.addAttribute("sessionName", sessionName);

		// Return session.html template
		return "session";
		
	} catch (Exception e) {
		// If error just return dashboard.html template
		model.addAttribute("username", httpSession.getAttribute("loggedUser"));
		return "dashboard";
	}
}
```
The code executed in `session.html` _< script >_ tag would also be the same. After the `Session.publish()` method has been succesful, both users will be seeing each other's video, as well as the username and the nickname below it.

---

### 4) Users leave the video-call**

After a while both users decide to leave the session. Apart from calling `session.disconnect()` (triggered in `leaveSession()` _onclick_ method) to destroy the connection on openvidu-server, we need another POST operation to let the backend know that certain user has left the session so it can update the collections with the active sessions and tokens.

In `session.html` template the "Leave session" button actually performs a POST operation to path `/leave-session` with a hidden form. Notice that when the user clicks the submit button, a POST operation will be triggered but also the `leaveSession()` method. First updates our backend. Second updates our openvidu-server.

```html
<form action="/leave-session" method="post">
	<input type="hidden" name="session-name" th:value="${sessionName}"></input>
	<input type="hidden" name="token" th:value="${token}"></input>
	<button type="submit" onclick="leaveSession()">Leave session</button>
</form>
```

In `SessionController.java` we update the collections:

```java
@RequestMapping(value = "/leave-session", method = RequestMethod.POST)
public String removeUser(@RequestParam(name = "session-name") String sessionName,
			 @RequestParam(name = "token") String token,
			 Model model, HttpSession httpSession) throws Exception {
	// Check the user is logged ... 
	
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
				model.addAttribute("sessionId", sessionId);
				return "redirect:/dashboard";
			} else {
				// The TOKEN wasn't valid
				model.addAttribute("sessionId", sessionId);
				return "redirect:/dashboard";
			}
		} else {
			// The SESSIONID wasn't valid
			model.addAttribute("sessionId", sessionId);
			return "redirect:/dashboard";
		}
	} else {
		// The SESSION does not exist
		model.addAttribute("sessionId", sessionId);
		return "redirect:/dashboard";
	}
}
```
When the last user leaves the session `this.mapSessions.remove(sessionName);` will be executed: this means the session is empty and that it is going to be closed. The _sessionId_ and all _token_ params associated to it will be invalidated.

---

> At this point we have covered all the important code from the tutorial. With this scenario we have seen the most common use-case, but you can modify whatever you want to suit your needs. And remember that this is just one of the many possible approaches: **you can implement your frontend and your backend as you want**. 
> 
> The only actual requirements are getting ***sessionId*** and ***token*** params from  ***openvidu-server*** (by using one of the available clients or with the REST API) and using them along with ***openvidu-browser*** to connect your clients to the sessions.