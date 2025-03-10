import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";

// Configuration
const SERVER_PORT = process.env.SERVER_PORT || 6080;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "http://localhost:7880";

const app = express();

app.use(cors());
app.use(express.json());

// Set the static files location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

const agentDispatchClient = new AgentDispatchClient(
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

// Generate access tokens for participants to join a room
app.post("/token", async (req, res) => {
  const roomName = req.body.roomName;
  const participantName = req.body.participantName;

  if (!roomName || !participantName) {
    return res
      .status(400)
      .json({ errorMessage: "roomName and participantName are required" });
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
  });
  at.addGrant({ roomJoin: true, room: roomName });
  const token = await at.toJwt();

  return res.json({ token });
});

// Store the agent dispatch ID to stop transcription
var agentDispatchId;

// Start the agent dispatch for STT
app.post("/stt", async (req, res) => {
  const AGENT_NAME = "speech-to-text";
  const { roomName } = req.body;
  try {
    const agentDispatch = await agentDispatchClient.createDispatch(
      roomName,
      AGENT_NAME
    );
    agentDispatchId = agentDispatch.id;
    return res.json({ agentDispatch });
  } catch (error) {
    console.error("Error creating agent dispatch", error);
    return res.status(500).send(error);
  }
});

// Delete the agent dispatch for STT
app.delete("/stt", async (req, res) => {
  const { roomName } = req.body;
  try {
    await agentDispatchClient.deleteDispatch(agentDispatchId, roomName);
    return res.status(200).send();
  } catch (error) {
    console.error("Error deleting agent dispatch", error);
    return res.status(500).send(error);
  }
});

// Start the server
app.listen(SERVER_PORT, () => {
  console.log("Server started on port:", SERVER_PORT);
});
