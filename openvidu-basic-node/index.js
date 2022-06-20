require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var https = require("https");
var fs = require("fs");
var OpenVidu = require("openvidu-node-client").OpenVidu;
var cors = require("cors");
var app = express();

// Allow for insecure certificate in OpenVidu deployment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Enable CORS support
app.use(
  cors({
    origin: "*",
  })
);

// Enable SSL
var server = https.createServer(
  {
    key: fs.readFileSync("./cert/key.pem"),
    cert: fs.readFileSync("./cert/cert.pem"),
  },
  app
);

// Allow application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Allow application/json
app.use(bodyParser.json());

// Serve application
server.listen(5000, () => {
  console.log("Application started");
});

var openvidu = new OpenVidu(
  process.env.OPENVIDU_URL,
  process.env.OPENVIDU_SECRET
);

app.post("/sessions", async (req, res) => {
  var session = await openvidu.createSession(req.body);
  res.send(session.sessionId);
});

app.post("/sessions/:sessionId/connections", async (req, res) => {
  var session = openvidu.activeSessions.find(
    (s) => s.sessionId === req.params.sessionId
  );
  if (!session) {
    res.status(404).send();
  } else {
    var connection = await session.createConnection(req.body);
    res.send(connection.token);
  }
});
