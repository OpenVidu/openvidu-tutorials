/* CONFIGURATION */

var OpenVidu = require('openvidu-node-client').OpenVidu;
var OpenViduRole = require('openvidu-node-client').OpenViduRole;

// Check launch arguments: must receive openvidu-server URL and the secret
if (process.argv.length != 4) {
    console.log("Usage: node " + __filename + " OPENVIDU_URL OPENVIDU_SECRET");
    process.exit(-1);
}
// For demo purposes we ignore self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
var port = process.env.PORT || 5000;
var useSSL = (process.env.USE_SSL === 'false') ? false : true


// Node imports
var express = require('express');
var fs = require('fs');
var httpServer = (useSSL) ? require('https') : require('http');
var bodyParser = require('body-parser'); // Pull information from HTML POST (express4)
var app = express(); // Create our app with express

// Server configuration
app.use(express.static(__dirname + '/public')); // Set the static files location
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // Parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // Parse application/vnd.api+json as json

// Listen (start app with node server.js)
var options = (useSSL) ? {
    key: fs.readFileSync('openvidukey.pem'),
    cert: fs.readFileSync('openviducert.pem')
} : {}
httpServer.createServer(options, app).listen(port);

// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = process.argv[2];
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = process.argv[3];

// Entrypoint to OpenVidu Node Client SDK
var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

// Collection to pair session names with OpenVidu Session objects
var mapSessions = {};
// Collection to pair session names with tokens
var mapSessionNamesTokens = {};

console.log(`App listening with ${(useSSL) ? "https": "http"} on port ${port} connected to OpenVidu at ${OPENVIDU_URL}`);




/* Session API */

// Get token (add new user to session)
app.post('/recording-node/api/get-token', function (req, res) {
    // The video-call to connect
    var sessionName = req.body.sessionName;

    // Role associated to this user
    var role = OpenViduRole.PUBLISHER;

    console.log("Getting a token | {sessionName}={" + sessionName + "}");

    // Build connectionProperties object with PUBLISHER role
    var connectionProperties = {
        role: role
    }

    if (mapSessions[sessionName]) {
        // Session already exists
        console.log('Existing session ' + sessionName);

        // Get the existing Session from the collection
        var mySession = mapSessions[sessionName];

        // Generate a new Connection asynchronously with the recently created connectionProperties
        mySession.createConnection(connectionProperties)
            .then(connection => {

                // Store the new token in the collection of tokens
                mapSessionNamesTokens[sessionName].push(connection.token);

                // Return the token to the client
                res.status(200).send({
                    0: connection.token
                });
            })
            .catch(error => {
                console.error(error);
                if (error.message === "404") {
                    delete mapSessions[sessionName];
                    delete mapSessionNamesTokens[sessionName];
                    newSession(sessionName, connectionProperties, res);
                }
            });
    } else {
        newSession(sessionName, connectionProperties, res);
    }
});

function newSession(sessionName, connectionProperties, res) {
    // New session
    console.log('New session ' + sessionName);

    // Create a new OpenVidu Session asynchronously
    OV.createSession()
        .then(session => {
            // Store the new Session in the collection of Sessions
            mapSessions[sessionName] = session;
            // Store a new empty array in the collection of tokens
            mapSessionNamesTokens[sessionName] = [];

            // Generate a new connection asynchronously with the recently created connectionProperties
            session.createConnection(connectionProperties)
                .then(connection => {

                    // Store the new token in the collection of tokens
                    mapSessionNamesTokens[sessionName].push(connection.token);

                    // Return the Token to the client
                    res.status(200).send({
                        0: connection.token
                    });
                })
                .catch(error => {
                    console.error(error);
                });
        })
        .catch(error => {
            console.error(error);
        });
}

// Remove user from session
app.post('/recording-node/api/remove-user', function (req, res) {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    var token = req.body.token;
    console.log('Removing user | {sessionName, token}={' + sessionName + ', ' + token + '}');

    // If the session exists
    if (mapSessions[sessionName] && mapSessionNamesTokens[sessionName]) {
        var tokens = mapSessionNamesTokens[sessionName];
        var index = tokens.indexOf(token);

        // If the token exists
        if (index !== -1) {
            // Token removed
            tokens.splice(index, 1);
            console.log(sessionName + ': ' + tokens.toString());
        } else {
            var msg = 'Problems in the app server: the TOKEN wasn\'t valid';
            console.log(msg);
            res.status(500).send(msg);
        }
        if (tokens.length == 0) {
            // Last user left: session must be removed
            console.log(sessionName + ' empty!');
            delete mapSessions[sessionName];
        }
        res.status(200).send();
    } else {
        var msg = 'Problems in the app server: the SESSION does not exist';
        console.log(msg);
        res.status(500).send(msg);
    }
});

// Close session
app.delete('/recording-node/api/close-session', function (req, res) {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    console.log("Closing session | {sessionName}=" + sessionName);

    // If the session exists
    if (mapSessions[sessionName]) {
        var session = mapSessions[sessionName];
        session.close();
        delete mapSessions[sessionName];
        delete mapSessionNamesTokens[sessionName];
        res.status(200).send();
    } else {
        var msg = 'Problems in the app server: the SESSION does not exist';
        console.log(msg);
        res.status(500).send(msg);
    }
});

// Fetch session info
app.post('/recording-node/api/fetch-info', function (req, res) {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    console.log("Fetching session info | {sessionName}=" + sessionName);

    // If the session exists
    if (mapSessions[sessionName]) {
        mapSessions[sessionName].fetch()
            .then(changed => {
                console.log("Any change: " + changed);
                res.status(200).send(sessionToJson(mapSessions[sessionName]));
            })
            .catch(error => res.status(400).send(error.message));
    } else {
        var msg = 'Problems in the app server: the SESSION does not exist';
        console.log(msg);
        res.status(500).send(msg);
    }
});

// Fetch all session info
app.get('/recording-node/api/fetch-all', function (req, res) {
    console.log("Fetching all session info");
    OV.fetch()
        .then(changed => {
            var sessions = [];
            OV.activeSessions.forEach(s => {
                sessions.push(sessionToJson(s));
            });
            console.log("Any change: " + changed);
            res.status(200).send(sessions);
        })
        .catch(error => res.status(400).send(error.message));
});

// Force disconnect
app.delete('/recording-node/api/force-disconnect', function (req, res) {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    var connectionId = req.body.connectionId;
    // If the session exists
    if (mapSessions[sessionName]) {
        mapSessions[sessionName].forceDisconnect(connectionId)
            .then(() => res.status(200).send())
            .catch(error => res.status(400).send(error.message));
    } else {
        var msg = 'Problems in the app server: the SESSION does not exist';
        console.log(msg);
        res.status(500).send(msg);
    }
});

// Force unpublish
app.delete('/recording-node/api/force-unpublish', function (req, res) {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    var streamId = req.body.streamId;
    // If the session exists
    if (mapSessions[sessionName]) {
        mapSessions[sessionName].forceUnpublish(streamId)
            .then(() => res.status(200).send())
            .catch(error => res.status(400).send(error.message));
    } else {
        var msg = 'Problems in the app server: the SESSION does not exist';
        console.log(msg);
        res.status(500).send(msg);
    }
});



/* Recording API */

// Start recording
app.post('/recording-node/api/recording/start', function (req, res) {
    // Retrieve params from POST body
    var recordingProperties = {
        outputMode: req.body.outputMode,
        hasAudio: req.body.hasAudio,
        hasVideo: req.body.hasVideo,
    }
    var sessionId = req.body.session;
    console.log("Starting recording | {sessionId}=" + sessionId);

    OV.startRecording(sessionId, recordingProperties)
        .then(recording => res.status(200).send(recording))
        .catch(error => res.status(400).send(error.message));
});

// Stop recording
app.post('/recording-node/api/recording/stop', function (req, res) {
    // Retrieve params from POST body
    var recordingId = req.body.recording;
    console.log("Stopping recording | {recordingId}=" + recordingId);

    OV.stopRecording(recordingId)
        .then(recording => res.status(200).send(recording))
        .catch(error => res.status(400).send(error.message));
});

// Delete recording
app.delete('/recording-node/api/recording/delete', function (req, res) {
    // Retrieve params from DELETE body
    var recordingId = req.body.recording;
    console.log("Deleting recording | {recordingId}=" + recordingId);

    OV.deleteRecording(recordingId)
        .then(() => res.status(200).send())
        .catch(error => res.status(400).send(error.message));
});

// Get recording
app.get('/recording-node/api/recording/get/:recordingId', function (req, res) {
    // Retrieve params from GET url
    var recordingId = req.params.recordingId;
    console.log("Getting recording | {recordingId}=" + recordingId);

    OV.getRecording(recordingId)
        .then(recording => res.status(200).send(recording))
        .catch(error => res.status(400).send(error.message));
});

// List all recordings
app.get('/recording-node/api/recording/list', function (req, res) {
    console.log("Listing recordings");

    OV.listRecordings()
        .then(recordings => res.status(200).send(recordings))
        .catch(error => res.status(400).send(error.message));
});

function sessionToJson(session) {
    var json = {};
    json.sessionId = session.sessionId;
    json.createdAt = session.createdAt;
    json.customSessionId = !!session.properties.customSessionId ? session.properties.customSessionId : "";
    json.recording = session.recording;
    json.mediaMode = session.properties.mediaMode;
    json.recordingMode = session.properties.recordingMode;
    json.defaultRecordingProperties = session.properties.defaultRecordingProperties;
    var connections = {};
    connections.numberOfElements = session.activeConnections.length;
    var jsonArrayConnections = [];
    session.activeConnections.forEach(con => {
        var c = {};
        c.connectionId = con.connectionId;
        c.createdAt = con.createdAt;
        c.role = con.role;
        c.serverData = con.serverData;
        c.record = con.record;
        c.token = con.token;
        c.clientData = con.clientData;
        var pubs = [];
        con.publishers.forEach(p => {
            jsonP = {};
            jsonP.streamId = p.streamId;
            jsonP.createdAt = p.createdAt
            jsonP.hasAudio = p.hasAudio;
            jsonP.hasVideo = p.hasVideo;
            jsonP.audioActive = p.audioActive;
            jsonP.videoActive = p.videoActive;
            jsonP.frameRate = p.frameRate;
            jsonP.typeOfVideo = p.typeOfVideo;
            jsonP.videoDimensions = p.videoDimensions;
            pubs.push(jsonP);
        });
        var subs = [];
        con.subscribers.forEach(s => {
            subs.push(s);
        });
        c.publishers = pubs;
        c.subscribers = subs;
        jsonArrayConnections.push(c);
    });
    connections.content = jsonArrayConnections;
    json.connections = connections;
    return json;
}