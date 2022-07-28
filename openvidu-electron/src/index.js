const ipcRenderer = require('electron').ipcRenderer;
const { BrowserWindow } = require('@electron/remote');

const { OpenVidu } = require('openvidu-browser');
const axios = require('axios');

var openvidu;
var session;
var publisher;
var mySessionId;

ipcRenderer.on('screen-share-ready', (event, message) => {
    if (!!message) {
        // User has chosen a screen to share. screenId is message parameter
        showSession();
        publisher = openvidu.initPublisher("publisher", {
            videoSource: "screen:" + message
        });
        joinSession();
    }
});

function initPublisher() {

    openvidu = new OpenVidu();

    const shareScreen = document.getElementById("screen-sharing").checked;
    if (shareScreen) {
        openScreenShareModal();
    } else {
        publisher = openvidu.initPublisher("publisher");
        joinSession();
    }
}

async function joinSession() {

    session = openvidu.initSession();
    session.on("streamCreated", function (event) {
        session.subscribe(event.stream, "subscriber");
    });

    mySessionId = document.getElementById("sessionId").value;

    const token = await getToken(mySessionId);

    await session.connect(token, { clientData: 'OpenVidu Electron' });
    showSession();
    session.publish(publisher);
}

function leaveSession() {
    session.disconnect();
    hideSession();
}

function showSession() {
    document.getElementById("session-header").innerText = mySessionId;
    document.getElementById("join").style.display = "none";
    document.getElementById("session").style.display = "block";
}

function hideSession() {
    document.getElementById("join").style.display = "block";
    document.getElementById("session").style.display = "none";
}

function openScreenShareModal() {
    let win = new BrowserWindow({
        parent: require('@electron/remote').getCurrentWindow(),
        modal: true,
        minimizable: false,
        maximizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
        resizable: false
    });
    require("@electron/remote").require("@electron/remote/main").enable(win.webContents);

    win.setMenu(null);
    // win.webContents.openDevTools();

    var theUrl = 'file://' + __dirname + '/modal.html'
    win.loadURL(theUrl);
}


/**
 * --------------------------------------------
 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
 * --------------------------------------------
 * The methods below request the creation of a Session and a Token to
 * your application server. This keeps your OpenVidu deployment secure.
 * 
 * In this sample code, there is no user control at all. Anybody could
 * access your application server endpoints! In a real production
 * environment, your application server must identify the user to allow
 * access to the endpoints.
 * 
 * Visit https://docs.openvidu.io/en/stable/application-server to learn
 * more about the integration of OpenVidu in your application server.
 */

var APPLICATION_SERVER_URL = 'http://localhost:5000/';

async function getToken(mySessionId) {
    const sessionId = await createSession(mySessionId);
    return await createToken(sessionId);
}

async function createSession(sessionId) {
    const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions', { customSessionId: sessionId }, {
        headers: { 'Content-Type': 'application/json', },
    });
    return response.data; // The sessionId
}

async function createToken(sessionId) {
    const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections', {}, {
        headers: { 'Content-Type': 'application/json', },
    });
    return response.data; // The token
}