// Application variables
var OV;
var session;
var publisher;
var virtualBackground;
var backgroundImageUrl;

/* OPENVIDU METHODS */

function joinSession() {
  var mySessionId = $("#sessionId").val();
  var myUserName = $("#userName").val();

  // --- 1) Get an OpenVidu object ---

  OV = new OpenVidu();

  // --- 2) Init a session ---

  session = OV.initSession();

  // --- 3) Specify the actions when events take place in the session ---

  // On every new Stream received...
  session.on("streamCreated", (event) => {
    // Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
    var subscriber = session.subscribe(event.stream, "video-container");

    // When the HTML video has been appended to DOM...
    subscriber.on("videoElementCreated", (event) => {
      // Add a new <p> element for the user's nickname just below its video
      appendUserData(event.element, subscriber);
    });

    // When the video starts playing remove the spinner
    subscriber.on("streamPlaying", function (event) {
      $("#spinner-" + subscriber.stream.connection.connectionId).remove();
    });
  });

  // On every Stream destroyed...
  session.on("streamDestroyed", (event) => {
    // Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
    removeUserData(event.stream.connection);
  });

  // On every asynchronous exception...
  session.on("exception", (exception) => {
    console.warn(exception);
  });

  // --- 4) Connect to the session with a valid user token ---

  // 'getToken' method is simulating what your server-side should do.
  // 'token' parameter should be retrieved and returned by your own backend
  getToken(mySessionId).then((token) => {
    // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
    // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
    session
      .connect(token, { clientData: myUserName })
      .then(() => {
        // --- 5) Set page layout for active call ---

        $("#session-title").text(mySessionId);
        $("#join").hide();
        $("#session").show();

        // --- 6) Get your own camera stream with the desired properties ---

        var publisherProperties = {
          audioSource: undefined, // The source of audio. If undefined default microphone
          videoSource: undefined, // The source of video. If undefined default webcam
          publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
          publishVideo: true, // Whether you want to start publishing with your video enabled or not
          resolution: "640x360", // The resolution of your video
          framerate: 24,
          mirror: true, // Whether to mirror your local video or not
        };

        publisher = OV.initPublisher("video-container", publisherProperties);

        // --- 7) Specify the actions when events take place in our publisher ---

        // When our HTML video has been added to DOM...
        publisher.on("videoElementCreated", function (event) {
          appendUserData(event.element, publisher);
          initMainVideo(publisher, myUserName);
        });
        // When our video has started playing...
        publisher.on("streamPlaying", function (event) {
          $("#spinner-" + publisher.stream.connection.connectionId).remove();
          $("#virtual-background-btns").show();
        });

        // --- 8) Publish your stream ---
        session.publish(publisher);
      })
      .catch((error) => {
        console.log(
          "There was an error connecting to the session:",
          error.code,
          error.message
        );
      });
  });
}

function leaveSession() {
  // --- 9) Leave the session by calling 'disconnect' method over the Session object ---

  session.disconnect();

  // Removing all HTML elements with user's nicknames.
  // HTML videos are automatically removed when leaving a Session
  removeAllUserData();

  // Reset all variables
  virtualBackground = undefined;
  backgroundImageUrl = undefined;
  OV = undefined;
  session = undefined;
  publisher = undefined;
  noVirtualBackgroundButtons();
  $("#image-office").prop("checked", true);

  // Back to 'Join session' page
  $("#join").show();
  $("#virtual-background-btns").hide();
  $("#session").hide();
}

// --- Virtual Background related methods ---

async function removeVirtualBackground() {
  blockVirtualBackgroundButtons();
  await publisher.stream.removeFilter();
  virtualBackground = undefined;
  noVirtualBackgroundButtons();
}

async function applyBlur() {
  blockVirtualBackgroundButtons();
  if (!!virtualBackground) {
    await publisher.stream.removeFilter();
  }
  virtualBackground = await publisher.stream.applyFilter("VB:blur");
  blurVirtualBackgroundButtons();
}

async function applyImage() {
  blockVirtualBackgroundButtons();
  if (!!virtualBackground) {
    await publisher.stream.removeFilter();
  }
  var url = !!backgroundImageUrl ? backgroundImageUrl : "https://raw.githubusercontent.com/OpenVidu/openvidu.io/master/img/vb/office.jpeg";
  virtualBackground = await publisher.stream.applyFilter("VB:image", { url: url });
  imageVirtualBackgroundButtons();
}

async function modifyImage(radioButtonEvent) {
  if (!!virtualBackground && virtualBackground.type === "VB:image") {
    blockVirtualBackgroundButtons();
    var imageUrl = "https://raw.githubusercontent.com/OpenVidu/openvidu.io/master/img/vb/" + radioButtonEvent.value;
    if (backgroundImageUrl !== imageUrl) {
      await virtualBackground.execMethod("update", { url: imageUrl });
      backgroundImageUrl = imageUrl;
    }
    imageVirtualBackgroundButtons();
  }
}

// --- End Virtual Background related methods ---

/* APPLICATION SPECIFIC METHODS */

window.addEventListener("load", function () {
  generateParticipantInfo();
  $('[data-toggle="tooltip"]').tooltip({ container: "body", trigger: "hover" });
});

window.onbeforeunload = function () {
  if (session) session.disconnect();
};

function generateParticipantInfo() {
  $("#sessionId").val("SessionA");
  $("#userName").val("Participant" + Math.floor(Math.random() * 100));
}

var spinnerNodeHtml =
  '<div class="spinner"><div class="sk-circle1 sk-child"></div><div class="sk-circle2 sk-child"></div><div class="sk-circle3 sk-child"></div>' +
  '<div class="sk-circle4 sk-child"></div><div class="sk-circle5 sk-child"></div><div class="sk-circle6 sk-child"></div><div class="sk-circle7 sk-child"></div>' +
  '<div class="sk-circle8 sk-child"></div><div class="sk-circle9 sk-child"></div><div class="sk-circle10 sk-child"></div><div class="sk-circle11 sk-child"></div>' +
  '<div class="sk-circle12 sk-child"></div></div>';

function appendUserData(videoElement, streamManager) {
  var userData = JSON.parse(streamManager.stream.connection.data).clientData;
  var nodeId = streamManager.stream.connection.connectionId;
  // Insert user nickname
  var dataNode = $(
    '<div id="data-' +
      nodeId +
      '" class="data-node"><p>' +
      userData +
      "</p></div>"
  );
  dataNode.insertAfter($(videoElement));
  // Insert spinner loader
  var spinnerNode = $(spinnerNodeHtml).attr("id", "spinner-" + nodeId);
  dataNode.append(spinnerNode);
  addClickListener(videoElement, streamManager);
}

function removeUserData(connection) {
  $("#data-" + connection.connectionId).remove();
}

function removeAllUserData() {
  $(".data-node").remove();
  $("#main-video div p").html("");
}

function addClickListener(videoElement, streamManager) {
  videoElement.addEventListener("click", function () {
    var mainVideo = $("#main-video video").get(0);
    // Only apply all these changes if not clicked on the same video again
    if (!streamManager.videos.map((v) => v.video).includes(mainVideo)) {
      selectedStreamManager = streamManager;
      $("#main-video").fadeOut("fast", () => {
        // Put the nickname of the clicked user in the main video view
        var nickname = JSON.parse(
          streamManager.stream.connection.data
        ).clientData;
        $("#main-video div p").html(nickname);
        // Change the ownership of the main video to the clicked StreamManager (Publisher or Subscriber)
        streamManager.addVideoElement(mainVideo);
        $("#main-video").fadeIn("fast");
      });
    }
  });
}

function initMainVideo(streamManager, userData) {
  var videoEl = $("#main-video video").get(0);
  videoEl.onplaying = () => {
    $("#main-video div .spinner").remove();
  };
  streamManager.addVideoElement(videoEl);
  $("#main-video div p").html(userData);
  $("#main-video div").append($(spinnerNodeHtml));
  $("#main-video video").prop("muted", true);
  selectedStreamManager = streamManager;
}

function blockVirtualBackgroundButtons() {
  $(".btn-vb").each((index, elem) => {
    $(elem).prop("disabled", true);
  });
}

function noVirtualBackgroundButtons() {
  $("#buttonRemoveVirtualBackground").prop("disabled", true);
  $("#buttonApplyBlur").prop("disabled", false);
  $("#buttonApplyImage").prop("disabled", false);
  $("#radio-btns").hide();
}

function blurVirtualBackgroundButtons() {
  $("#buttonRemoveVirtualBackground").prop("disabled", false);
  $("#buttonApplyBlur").prop("disabled", true);
  $("#buttonApplyImage").prop("disabled", false);
  $("#radio-btns").hide();
}

function imageVirtualBackgroundButtons() {
  $("#buttonRemoveVirtualBackground").prop("disabled", false);
  $("#buttonApplyBlur").prop("disabled", false);
  $("#buttonApplyImage").prop("disabled", true);
  $("#radio-btns").css('display', 'inline-block');
  $('input[name="backgroundImage"]').removeAttr("disabled");
}


/**
 * --------------------------
 * SERVER-SIDE RESPONSIBILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the REST API, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
 *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
 *   3) The Connection.token must be consumed in Session.connect() method
 */

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";

function getToken(mySessionId) {
  return createSession(mySessionId).then((sessionId) => createToken(sessionId));
}

function createSession(sessionId) {
  // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessions
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: OPENVIDU_SERVER_URL + "/openvidu/api/sessions",
      data: JSON.stringify({ customSessionId: sessionId }),
      headers: {
        Authorization: "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
        "Content-Type": "application/json",
      },
      success: (response) => resolve(response.id),
      error: (error) => {
        if (error.status === 409) {
          resolve(sessionId);
        } else {
          console.warn(
            "No connection to OpenVidu Server. This may be a certificate error at " +
              OPENVIDU_SERVER_URL
          );
          if (
            window.confirm(
              'No connection to OpenVidu Server. This may be a certificate error at "' +
                OPENVIDU_SERVER_URL +
                '"\n\nClick OK to navigate and accept it. ' +
                'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                OPENVIDU_SERVER_URL +
                '"'
            )
          ) {
            location.assign(OPENVIDU_SERVER_URL + "/accept-certificate");
          }
        }
      },
    });
  });
}

function createToken(sessionId) {
  // See https://docs.openvidu.io/en/stable/reference-docs/REST-API/#post-openviduapisessionsltsession_idgtconnection
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url:
        OPENVIDU_SERVER_URL +
        "/openvidu/api/sessions/" +
        sessionId +
        "/connection",
      data: JSON.stringify({}),
      headers: {
        Authorization: "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
        "Content-Type": "application/json",
      },
      success: (response) => resolve(response.token),
      error: (error) => reject(error),
    });
  });
}
