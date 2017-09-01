/* CONFIGURATION */

var OpenVidu = require('openvidu-node-client').OpenVidu;
var Session = require('openvidu-node-client').Session;
var OpenViduRole = require('openvidu-node-client').OpenViduRole;
var TokenOptions = require('openvidu-node-client').TokenOptions;

// Check launch arguments: must receive openvidu-server URL and the secret
if (process.argv.length != 4) {
    console.log("Usage: node " + __filename + " OPENVIDU_URL OPENVIDU_SECRET");
    process.exit(-1);
}
// For demo purposes we ignore self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

// Node imports
var express = require('express');
var fs = require('fs');
var session = require('express-session');
var https = require('https');
var bodyParser = require('body-parser'); // Pull information from HTML POST (express4)
var app = express(); // Create our app with express

// Server configuration
app.use(session({
    saveUninitialized: true,
    resave: false,
    secret: 'MY_SECRET'
}));
app.use(express.static(__dirname + '/public')); // set the static files location
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // Parse application/vnd.api+json as json
app.set('view engine', 'ejs'); // Embedded JavaScript as template engine

// Listen (start app with node server.js)
var options = {
    key: fs.readFileSync('openvidukey.pem'),
    cert: fs.readFileSync('openviducert.pem')
};
https.createServer(options, app).listen(5000);
console.log("App listening on https://localhost:5000");

// Mock database
var users = [{
    user: "publisher1",
    pass: "pass",
    role: OpenViduRole.PUBLISHER
}, {
    user: "publisher2",
    pass: "pass",
    role: OpenViduRole.PUBLISHER
}, {
    user: "subscriber",
    pass: "pass",
    role: OpenViduRole.SUBSCRIBER
}];

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

/* CONFIGURATION */



/* REST API */

app.post('/', loginController);
app.get('/', loginController);

function loginController(req, res) {
    if (req.session.loggedUser) { // User is logged
        user = req.session.loggedUser;
        res.redirect('/dashboard');
    } else { // User is not logged
        req.session.destroy();
        res.render('index.ejs');
    }
}

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

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
        console.log("Logging in | {user, pass}={" + user + ", " + pass + "}");
		
		if (login(user, pass)) { // Correct user-pass
			// Validate session and return OK 
            // Value stored in req.session allows us to identify the user in future requests
            console.log("'" + user + "' has logged in");
	    	req.session.loggedUser = user;
			res.render('dashboard.ejs', {
				user: user
			});
		} else { // Wrong user-pass
            // Invalidate session and return index template
            console.log("'" + user + "' invalid credentials");
			req.session.destroy();
			res.redirect('/');
		}
	}
}

app.post('/session', (req, res) => {
    if (!isLogged(req.session)) {
        req.session.destroy();
        res.redirect('/');
    } else {
       	// The nickname sent by the client
        var clientData = req.body.data;
        // The video-call to connect ("TUTORIAL")
        var sessionName = req.body.sessionname;

        // Role associated to this user
        var role = users.find(u => (u.user === req.session.loggedUser)).role;

        // Optional data to be passed to other users when this user connects to the video-call
        // In this case, a JSON with the value we stored in the req.session object on login
        var serverData = '{"serverData": "' + req.session.loggedUser + '"}';
        
        console.log("Getting sessionId and token | {sessionName}={" + sessionName + "}");

        // Build tokenOptions object with the serverData and the role
        var tokenOptions = new TokenOptions.Builder()
            .data(serverData)
            .role(role)
            .build();

        if (mapSessionNameSession[sessionName]) {
            // Session already exists: return existing sessionId and a new token
            console.log('Existing session ' + sessionName);
            
            // Get the existing Session from the collection
            var mySession = mapSessionNameSession[sessionName];
            
            // Generate a new token asynchronously with the recently created tokenOptions
            mySession.generateToken(tokenOptions, function (token) {
                
                // Get the existing sessionId
                var sessionId = mySession.getSessionId();
                
                // Store the new token in the collection of tokens
                mapSessionIdTokens[sessionId].push(token);
                
                // Return session template with all the needed attributes
                console.log('SESSIONID: ' + sessionId);
                console.log('TOKEN: ' + token);
                res.render('session.ejs', {
                    sessionId: sessionId,
                    token: token,
                    nickName: clientData,
                    userName: req.session.loggedUser,
                    sessionName: sessionName
                });
            });
        } else { // New session: return a new sessionId and a new token
            console.log('New session ' + sessionName);

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
                    console.log('SESSIONID: ' + sessionId);
                    console.log('TOKEN: ' + token);
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
    }
});

app.post('/leave-session', (req, res) => {
    if (!isLogged(req.session)) {
        req.session.destroy();
        res.render('index.ejs');
    } else {
        // Retrieve params from POST body
        var sessionName = req.body.sessionname;
        var token = req.body.token;
        console.log('Removing user | {sessionName, token}={' + sessionName + ', ' + token + '}');
        
        // If the session exists
        var mySession = mapSessionNameSession[sessionName];
        if (mySession) {
            var tokens = mapSessionIdTokens[mySession.getSessionId()];
            if (tokens) {
                var index = tokens.indexOf(token);
                
                // If the token exists
                if (index !== -1) {
                    // Token removed!
                    tokens.splice(index, 1);
                    console.log(sessionName + ': ' + mapSessionIdTokens[mySession.getSessionId()].toString());
                } else {
                    var msg = 'Problems in the app server: the TOKEN wasn\'t valid';
                    console.log(msg);
                    res.redirect('/dashboard');
                }
                if (mapSessionIdTokens[mySession.getSessionId()].length == 0) {
                    // Last user left: session must be removed
                    console.log(sessionName + ' empty!');
                    delete mapSessionNameSession[sessionName];
                }
                res.redirect('/dashboard');
            } else {
                var msg = 'Problems in the app server: the SESSIONID wasn\'t valid';
                console.log(msg);
                res.redirect('/dashboard');
            }
        } else {
            var msg = 'Problems in the app server: the SESSION does not exist';
            console.log(msg);
            res.redirect('/dashboard');
        }
    }
});

/* REST API */



/* AUXILIARY METHODS */

function login(user, pass) {
    return (user != null &&
        pass != null &&
        users.find(u => (u.user === user) && (u.pass === pass)));
}

function isLogged(session) {
    return (session.loggedUser != null);
}

function getBasicAuth() {
    return 'Basic ' + (new Buffer('OPENVIDUAPP:' + OPENVIDU_SECRET).toString('base64'));
}

/* AUXILIARY METHODS */
