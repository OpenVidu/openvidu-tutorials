// Check launch arguments
if (process.argv.length != 4) {
    console.log("Usage: node " + __filename + " OPENVIDU_URL OPENVIDU_SECRET");
    process.exit(-1);
}
// For demo purposes we ignore self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

// Imports
var express = require('express');
var fs = require('fs');
var session = require('express-session');
var https = require('https');
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var app = express(); // create our app w/ express

// Configuration
app.use(session({
    saveUninitialized: true,
    resave: false,
    secret: 'MY_SECRET'
}));
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json

// listen (start app with node server.js)
var options = {
    key: fs.readFileSync('openvidukey.pem'),
    cert: fs.readFileSync('openviducert.pem')
};
https.createServer(options, app).listen(5000);
console.log("App listening on port https://[]:5000");

// Environment variables
var OPENVIDU_URL = process.argv[2];
var OPENVIDU_SECRET = process.argv[3];

// Mock database
var users = [{
    user: "publisher1",
    pass: "pass",
    role: "PUBLISHER"
}, {
    user: "publisher2",
    pass: "pass",
    role: "PUBLISHER"
}, {
    user: "subscriber",
    pass: "pass",
    role: "SUBSCRIBER"
}];

// Objects for storing active sessions and users
var mapSessionNameSessionId = {};
var mapSessionIdsTokens = {};


// APIRest
app.post('/api-login/login', function (req, res) {
    var user = req.body.user;
    var pass = req.body.pass;
    console.log("Logging in | {user, pass}={" + user + ", " + pass + "}");

    if (login(user, pass)) {
        console.log("'" + user + "' has logged in");
        req.session.loggedUser = user;
        res.status(200).send();
    } else {
        console.log("'" + user + "' invalid credentials");
        req.session.destroy();
        res.status(401).send('User/Pass incorrect');
    }
});

app.get('/api-login/logout', function (req, res) {
    console.log("'" + req.session.loggedUser + "' has logged out");
    req.session.destroy();
    res.status(200).send();
});

app.post('/api-sessions/get-sessionid-token', function (req, res) {
    if (!isLogged(req.session)) {
        req.session.destroy();
        res.status(401).send('User not logged');
    } else {
        var sessionName = req.body.session;
        var role = users.find(u => (u.user === req.session.loggedUser)).role;
        var serverData = '{"serverData": "' + req.session.loggedUser + '"}';
        console.log("Getting sessionId and token | {sessionName}={" + sessionName + "}");

        var sessionId = mapSessionNameSessionId[sessionName];
        if (sessionId) {
            console.log('Existing session ' + sessionName);
            getToken(sessionId, role, serverData, function (token) {
                mapSessionIdsTokens[sessionId].push(token);
                console.log('SESSIONID: ' + sessionId);
                console.log('TOKEN: ' + token);
                res.status(200).send({
                    0: sessionId,
                    1: token
                });
            });
        } else {
            console.log('New session ' + sessionName);
            getSessionId(function (sessionId) {
                mapSessionNameSessionId[sessionName] = sessionId;
                mapSessionIdsTokens[sessionId] = [];
                getToken(sessionId, role, serverData, function (token) {
                    mapSessionIdsTokens[sessionId].push(token);
                    console.log('SESSIONID: ' + sessionId);
                    console.log('TOKEN: ' + token);
                    res.status(200).send({
                        0: sessionId,
                        1: token
                    });
                });
            });
        }
    }
});

app.post('/api-sessions/remove-user', function (req, res) {
    if (!isLogged(req.session)) {
        req.session.destroy();
        res.status(401).send('User not logged');
    } else {
        var sessionName = req.body.sessionName;
        var token = req.body.token;
        console.log('Removing user | {sessionName, token}={' + sessionName + ", " + token + '}');
        var sessionId = mapSessionNameSessionId[sessionName];
        if (sessionId) {
            var tokens = mapSessionIdsTokens[sessionId];
            if (tokens) {
                var index = tokens.indexOf(token);
                if (index !== -1) { // User left the session
                    tokens.splice(index, 1);
                    console.log(sessionName + ': ' + mapSessionIdsTokens[sessionId].toString());
                } else {
                    var msg = 'Problems in the app server: the TOKEN wasn\'t valid';
                    console.log(msg);
                    res.status(500).send(msg);
                }
                if (mapSessionIdsTokens[sessionId].length == 0) { // Last user left the session
                    console.log(sessionName + ' empty!');
                    delete mapSessionNameSessionId[sessionName];
                }
                res.status(200).send();
            } else {
                var msg = 'Problems in the app server: the SESSIONID wasn\'t valid';
                console.log(msg);
                res.status(500).send(msg);
            }
        } else {
            var msg = 'Problems in the app server: the SESSION does not exist';
            console.log(msg);
            res.status(500).send(msg);
        }
    }
});


function login(user, pass) {
    return (users.find(u => (u.user === user) && (u.pass === pass)));
}

function isLogged(session) {
    return (session.loggedUser != null);
}

function getBasicAuth() {
    return 'Basic ' + (new Buffer('OPENVIDUAPP:' + OPENVIDU_SECRET).toString('base64'));
}

// HTTP request to OpenVidu Server to get a sessionId
function getSessionId(callback) {
    var options = {
        hostname: OPENVIDU_URL,
        port: 8443,
        path: '/api/sessions',
        method: 'POST',
        headers: {
            'Authorization': getBasicAuth()
        }
    }
    const req = https.request(options, (res) => {
        var body = '';
        res.on('data', (d) => {
            // Continuously update stream with data
            body += d;
        });
        res.on('end', function () {
            // Data reception is done
            var parsed = JSON.parse(body);
            callback(parsed.id);
        });
    });

    req.on('error', (e) => {
        console.error(e);
    });
    req.end();
}

// HTTP request to OpenVidu Server to get a token
function getToken(sessionId, role, data, callback) {
    var requestBody = JSON.stringify({
        'session': sessionId,
        'role': role,
        'data': data
    });
    var options = {
        hostname: OPENVIDU_URL,
        port: 8443,
        path: '/api/tokens',
        method: 'POST',
        headers: {
            'Authorization': getBasicAuth(),
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };
    const req = https.request(options, (res) => {
        var body = '';
        res.on('data', (d) => {
            // Continuously update stream with data
            body += d;
        });
        res.on('end', function () {
            // Data reception is done
            var parsed = JSON.parse(body);
            callback(parsed.token);
        });
    });

    req.on('error', (e) => {
        console.error(e);
    });
    req.write(requestBody);
    req.end();
}