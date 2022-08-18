// Application variables
var OV;
var session;
var publisher;
var virtualBackground;
var backgroundImageUrl;

/* OPENVIDU METHODS */

function joinSession() {

  var mySessionId = $("#sessionId").val(); // Session the user will join
  var myUserName = $("#userName").val(); // Nickname of the user in the session

  // --- 1) Get an OpenVidu object ---

  OV = new OpenVidu();

  // --- 2) Init a session ---

  session = OV.initSession();

  // --- 3) Specify the actions when events take place in the session ---

  // On every new Stream received...
  session.on("streamCreated", event => {
    // Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
    var subscriber = session.subscribe(event.stream, "video-container");

    // When the HTML video has been appended to DOM...
    subscriber.on("videoElementCreated", event => {
      // Add a new <p> element for the user's nickname just below its video
      appendUserData(event.element, subscriber);
    });

    // When the video starts playing remove the spinner
    subscriber.on("streamPlaying", event => {
      $("#spinner-" + subscriber.stream.connection.connectionId).remove();
    });
  });

  // On every Stream destroyed...
  session.on("streamDestroyed", event => {
    // Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
    removeUserData(event.stream.connection);
  });

  // On every asynchronous exception...
  session.on("exception", exception => {
    console.warn(exception);
  });

  // --- 4) Connect to the session with a valid user token ---

  // Get a token from the OpenVidu deployment
  getToken(mySessionId).then(token => {

    // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
    // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
    session.connect(token, { clientData: myUserName })
      .then(() => {

        // --- 5) Set page layout for active call ---

        document.getElementById('session-title').innerText = mySessionId;
        document.getElementById('join').style.display = 'none';
        document.getElementById('session').style.display = 'block';

        // --- 6) Get your own camera stream with the desired properties ---

        var publisher = OV.initPublisher('video-container', {
          audioSource: undefined, // The source of audio. If undefined default microphone
          videoSource: undefined, // The source of video. If undefined default webcam
          publishAudio: true,  	  // Whether you want to start publishing with your audio unmuted or not
          publishVideo: true,  	  // Whether you want to start publishing with your video enabled or not
          resolution: '640x480',  // The resolution of your video
          frameRate: 24,			    // The frame rate of your video
          insertMode: 'APPEND',	  // How the video is inserted in the target element 'video-container'
          mirror: true       	    // Whether to mirror your local video or not
        });

        // --- 7) Specify the actions when events take place in our publisher ---

        // When our HTML video has been added to DOM...
        publisher.on('videoElementCreated', function (event) {
          initMainVideo(event.element, myUserName);
          appendUserData(event.element, myUserName);
          event.element['muted'] = true;
        });
        // When our video has started playing...
        publisher.on('streamPlaying', event => {
          $('#spinner-' + publisher.stream.connection.connectionId).remove();
          $('#virtual-background-btns').show();
        });

        // --- 8) Publish your stream ---

        session.publish(publisher);

      })
      .catch(error => {
        console.log('There was an error connecting to the session:', error.code, error.message);
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

async function modifyImage(radioBtnEvent) {
  if (!!virtualBackground && virtualBackground.type === "VB:image") {
    blockVirtualBackgroundButtons();
    var imageUrl = "https://raw.githubusercontent.com/OpenVidu/openvidu.io/master/img/vb/" + radioBtnEvent.value;
    if (backgroundImageUrl !== imageUrl) {
      await virtualBackground.execMethod("update", { url: imageUrl });
      backgroundImageUrl = imageUrl;
    }
    imageVirtualBackgroundButtons();
  }
}

async function removeVirtualBackground() {
  blockVirtualBackgroundButtons();
  await publisher.stream.removeFilter();
  virtualBackground = undefined;
  noVirtualBackgroundButtons();
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

var APPLICATION_SERVER_URL = "http://localhost:5000/";

function getToken(mySessionId) {
  return createSession(mySessionId).then(sessionId => createToken(sessionId));
}

function createSession(sessionId) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: APPLICATION_SERVER_URL + "api/sessions",
      data: JSON.stringify({ customSessionId: sessionId }),
      headers: { "Content-Type": "application/json" },
      success: response => resolve(response), // The sessionId
      error: (error) => reject(error)
    });
  });
}

function createToken(sessionId) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
      data: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
      success: (response) => resolve(response), // The token
      error: (error) => reject(error)
    });
  });
}