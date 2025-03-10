// When running OpenVidu locally, leave this variable empty
// For other deployment type, configure it with correct URL depending on your deployment
var LIVEKIT_URL = "";
configureLiveKitUrl();

const LivekitClient = window.LivekitClient;
let room;

function configureLiveKitUrl() {
  // If LIVEKIT_URL is not configured, use default value from OpenVidu Local deployment
  if (!LIVEKIT_URL) {
    if (window.location.hostname === "localhost") {
      LIVEKIT_URL = "ws://localhost:7880/";
    } else {
      LIVEKIT_URL = "wss://" + window.location.hostname + ":7443/";
    }
  }
}

async function joinRoom() {
  // Disable 'Join' button
  document.getElementById("join-button").disabled = true;
  document.getElementById("join-button").innerText = "Joining...";

  // Initialize a new Room object
  room = new LivekitClient.Room();

  // Specify the actions when events take place in the room
  // On every new Track received...
  room.on(
    LivekitClient.RoomEvent.TrackSubscribed,
    (track, _publication, participant) => {
      addTrack(track, participant.identity);
    }
  );

  // On every new Track destroyed...
  room.on(
    LivekitClient.RoomEvent.TrackUnsubscribed,
    (track, _publication, participant) => {
      track.detach();
      document.getElementById(track.sid)?.remove();

      if (track.kind === "video") {
        removeVideoContainer(participant.identity);
      }
    }
  );

  room.on(
    LivekitClient.RoomEvent.TranscriptionReceived,
    (transcription, participant, publication) => {
      for (const segment of transcription) {
        const textarea = document.getElementById("transcription");
        if (!segment.final) {
          // Indicate that there is a participant speaking
          const newText = `${participant.identity} is speaking...`;
          if (!textarea.value.endsWith(newText)) {
            textarea.value = textarea.value
              ? `${textarea.value}\n${newText}`
              : newText;
          }
        } else {
          // Participant finished speaking. Add the transcription to the textarea
          const time = new Date(segment.lastReceivedTime).toLocaleTimeString();
          const newText = `${participant.identity} at ${time}: ${segment.text}`;
          textarea.value = textarea.value
            ? `${textarea.value}\n${newText}`
            : newText;
        }
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  );

  try {
    // Get the room name and participant name from the form
    const roomName = document.getElementById("room-name").value;
    const userName = document.getElementById("participant-name").value;

    // Get a token from your application server with the room name and participant name
    const token = await getToken(roomName, userName);

    // Connect to the room with the LiveKit URL and the token
    await room.connect(LIVEKIT_URL, token);

    // Hide the 'Join room' page and show the 'Room' page
    document.getElementById("room-title").innerText = roomName;
    document.getElementById("join").hidden = true;
    document.getElementById("room").hidden = false;

    // Publish your camera and microphone
    await room.localParticipant.enableCameraAndMicrophone();
    const localVideoTrack = room.localParticipant.videoTrackPublications
      .values()
      .next().value.track;
    addTrack(localVideoTrack, userName, true);
  } catch (error) {
    console.log("There was an error connecting to the room:", error.message);
    await leaveRoom();
  }
}

function addTrack(track, participantIdentity, local = false) {
  const element = track.attach();
  element.id = track.sid;

  /* If the track is a video track, we create a container and append the video element to it 
    with the participant's identity */
  if (track.kind === "video") {
    const videoContainer = createVideoContainer(participantIdentity, local);
    videoContainer.append(element);
    appendParticipantData(
      videoContainer,
      participantIdentity + (local ? " (You)" : "")
    );
  } else {
    document.getElementById("layout-container").append(element);
  }
}

async function leaveRoom() {
  // Leave the room by calling 'disconnect' method over the Room object
  await room.disconnect();

  // Remove all HTML elements inside the layout container
  removeAllLayoutElements();

  // Reset transcription state
  document.getElementById("transcription").value = "";
  document.getElementById("transcription-button").disabled = false;
  document.getElementById("transcription-button").innerText =
    "Start transcription";
  document.getElementById("transcription-button").className = "btn btn-primary";

  // Back to 'Join room' page
  document.getElementById("join").hidden = false;
  document.getElementById("room").hidden = true;

  // Enable 'Join' button
  document.getElementById("join-button").disabled = false;
  document.getElementById("join-button").innerText = "Join!";
}

async function toggleTranscription() {
  const transcriptionButton = document.getElementById("transcription-button");
  const transcriptionArea = document.getElementById("transcription");
  if (transcriptionButton.innerText === "Start transcription") {
    transcriptionButton.disabled = true;
    transcriptionButton.innerText = "Starting transcription...";
    transcriptionButton.className = "btn btn-secondary";

    await startTranscription(room.name);

    transcriptionArea.disabled = false;
    transcriptionButton.disabled = false;
    transcriptionButton.innerText = "Stop transcription";
    transcriptionButton.className = "btn btn-danger";
  } else {
    transcriptionArea.disabled = true;
    transcriptionButton.disabled = true;
    transcriptionButton.innerText = "Stopping transcription...";
    transcriptionButton.className = "btn btn-secondary";

    await stopTranscription(room.name);

    transcriptionButton.disabled = false;
    transcriptionButton.innerText = "Start transcription";
    transcriptionButton.className = "btn btn-primary";
  }
}

window.onbeforeunload = async () => {
  await room?.disconnect();
};

document.addEventListener("DOMContentLoaded", async function () {
  generateFormValues();
});

function generateFormValues() {
  document.getElementById("room-name").value = "Test Room";
  document.getElementById("participant-name").value =
    "Participant" + Math.floor(Math.random() * 100);
}

function createVideoContainer(participantIdentity, local = false) {
  const videoContainer = document.createElement("div");
  videoContainer.id = `camera-${participantIdentity}`;
  videoContainer.className = "video-container";
  const layoutContainer = document.getElementById("layout-container");

  if (local) {
    layoutContainer.prepend(videoContainer);
  } else {
    layoutContainer.append(videoContainer);
  }

  return videoContainer;
}

function appendParticipantData(videoContainer, participantIdentity) {
  const dataElement = document.createElement("div");
  dataElement.className = "participant-data";
  dataElement.innerHTML = `<p>${participantIdentity}</p>`;
  videoContainer.prepend(dataElement);
}

function removeVideoContainer(participantIdentity) {
  document.getElementById(`camera-${participantIdentity}`)?.remove();
}

function removeAllLayoutElements() {
  const layoutElements = document.getElementById("layout-container").children;
  Array.from(layoutElements).forEach((element) => {
    element.remove();
  });
}

/**
 * --------------------------------------------
 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
 * --------------------------------------------
 * The method below request the creation of a token to
 * your application server. This prevents the need to expose
 * your LiveKit API key and secret to the client side.
 *
 * In this sample code, there is no user control at all. Anybody could
 * access your application server endpoints. In a real production
 * environment, your application server must identify the user to allow
 * access to the endpoints.
 */
async function getToken(roomName, participantName) {
  const [error, body] = await httpRequest("POST", "/token", {
    roomName,
    participantName,
  });
  if (error) {
    throw new Error(`Failed to get token: ${error.message}`);
  }
  return body.token;
}

async function startTranscription(roomName) {
  const [error, response] = await httpRequest("POST", "/stt", { roomName });
  if (error) {
    console.error(`Failed to start transcription: ${error.message}`);
    return;
  }
  console.log("Transcription started", response.agentDispatch);
}

async function stopTranscription(roomName) {
  const [error] = await httpRequest("DELETE", "/stt", { roomName });
  if (error) {
    console.error(`Failed to stop transcription: ${error.message}`);
    return;
  }
  console.log("Transcription stopped");
}

async function httpRequest(method, url, body) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (method !== "GET" && body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseBody = await response.json();

    if (!response.ok) {
      console.error(responseBody.errorMessage);
      return [
        { status: response.status, message: responseBody.errorMessage },
        undefined,
      ];
    }

    return [undefined, responseBody];
  } catch (error) {
    console.error(error.message);
    return [{ status: 0, message: error.message }, undefined];
  }
}
