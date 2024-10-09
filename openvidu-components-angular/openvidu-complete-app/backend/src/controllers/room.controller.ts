import { Request, Response } from 'express';
import { LiveKitService } from '../services/livekit.service.js';
import { LoggerService } from '../services/logger.service.js';
import { OpenViduError } from '../models/error.model.js';
import { RoomService } from '../services/room.service.js';

const livekitService = LiveKitService.getInstance();
const roomService = RoomService.getInstance();
const logger = LoggerService.getInstance();

export const createRoom = async (req: Request, res: Response) => {
	const { participantName, roomName } = req.body;

	if (!roomName) {
		return res.status(400).json({ name: 'Room Error', message: 'Room name is required for this operation' });
	}

	if (!participantName) {
		return res.status(400).json({
			name: 'Room Error',
			message: 'Participant name is required for this operation'
		});
	}

	logger.verbose(`Creating room '${roomName}' with participant '${participantName}'`);

	try {
		const [token] = await Promise.all([
			livekitService.generateToken(roomName, participantName),
			roomService.createRoom(roomName)
		]);
		return res.status(200).json({ token });
	} catch (error) {
		logger.error(`Error creating room '${roomName}' with participant '${participantName}'`);
		console.error(error);

		if (error instanceof OpenViduError) {
			res.status(error.statusCode).json({ name: error.name, message: error.message });
		} else {
			res.status(500).json({ name: 'Room Error', message: 'Failed to create room' });
		}
	}
};
