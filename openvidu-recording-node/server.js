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
app.use(express.static(__dirname + '/public')); // Set the static files location
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // Parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // Parse application/vnd.api+json as json

// Listen (start app with node server.js)
var options = {
    key: fs.readFileSync('openvidukey.pem'),
    cert: fs.readFileSync('openviducert.pem')
};
https.createServer(options, app).listen(5000);

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

console.log("App listening on port 5000");




/* Session API */

// Get sessionId and token (add new user to session)
app.post('/api/get-sessionid-token', function (req, res) {
    // The video-call to connect ("TUTORIAL")
    var sessionName = req.body.session;

    console.log("Getting sessionId and token | {sessionName}={" + sessionName + "}");

    // Role associated to this user
    var role = OpenViduRole.PUBLISHER;

    // Build tokenOptions object with the serverData and the role
    var tokenOptions = new TokenOptions.Builder()
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
            mySession.getSessionId(function (sessionId) {

                // Store the new token in the collection of tokens
                mapSessionIdTokens[sessionId].push(token);

                // Return the sessionId and token to the client
                console.log('SESSIONID: ' + sessionId);
                console.log('TOKEN: ' + token);
                res.status(200).send({
                    0: sessionId,
                    1: token
                });
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

                console.log('SESSIONID: ' + sessionId);
                console.log('TOKEN: ' + token);

                // Return the sessionId and token to the client
                res.status(200).send({
                    0: sessionId,
                    1: token
                });
            });
        });
    }
});

// Remove user from session
app.post('/api/remove-user', function (req, res) {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    var token = req.body.token;
    console.log('Removing user | {sessionName, token}={' + sessionName + ', ' + token + '}');

    // If the session exists
    var mySession = mapSessionNameSession[sessionName];
    if (mySession) {
        mySession.getSessionId(function (sessionId) {
            var tokens = mapSessionIdTokens[sessionId];
            if (tokens) {
                var index = tokens.indexOf(token);

                // If the token exists
                if (index !== -1) {
                    // Token removed!
                    tokens.splice(index, 1);
                    console.log(sessionName + ': ' + mapSessionIdTokens[sessionId].toString());
                } else {
                    var msg = 'Problems in the app server: the TOKEN wasn\'t valid';
                    console.log(msg);
                    res.status(500).send(msg);
                }
                if (mapSessionIdTokens[sessionId].length == 0) {
                    // Last user left: session must be removed
                    console.log(sessionName + ' empty!');
                    delete mapSessionNameSession[sessionName];
                }
                res.status(200).send();
            } else {
                var msg = 'Problems in the app server: the SESSIONID wasn\'t valid';
                console.log(msg);
                res.status(500).send(msg);
            }
        });
    } else {
        var msg = 'Problems in the app server: the SESSION does not exist';
        console.log(msg);
        res.status(500).send(msg);
    }
});




/* Recording API */

// Start session recording
app.post('/api/recording/start', function (req, res) {
    // Retrieve params from POST body
    var sessionId = req.body.session;
    console.log("Starting recording | {sessionId}=" + sessionId);

    OV.startRecording(sessionId)
        .then(archive => res.status(200).send(archive))
        .catch(error => res.status(400).send(error.message));
});

// Start session recording
app.post('/api/recording/stop', function (req, res) {
    // Retrieve params from POST body
    var recordingId = req.body.recording;
    console.log("Stoping recording | {recordingId}=" + recordingId);

    OV.stopRecording(recordingId)
        .then(archive => res.status(200).send(archive))
        .catch(error => res.status(400).send(error.message));
});

// Start session recording
app.delete('/api/recording/delete', function (req, res) {
    // Retrieve params from DELETE body
    var recordingId = req.body.recording;
    console.log("Deleting recording | {recordingId}=" + recordingId);

    OV.deleteRecording(recordingId)
        .then(() => res.status(200).send())
        .catch(error => res.status(400).send(error.message));
});

// Start session recording
app.get('/api/recording/get/:recordingId', function (req, res) {
    // Retrieve params from GET url
    var recordingId = req.params.recordingId;
    console.log("Getting recording | {recordingId}=" + recordingId);

    OV.getRecording(recordingId)
        .then(archive => res.status(200).send(archive))
        .catch(error => res.status(400).send(error.message));
});

// Start session recording
app.get('/api/recording/list', function (req, res) {
    console.log("Listing recordings");

    OV.listRecordings()
        .then(archives => res.status(200).send(archives))
        .catch(error => res.status(400).send(error.message));
});