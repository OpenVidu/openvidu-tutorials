import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service.js';
import { OpenViduError } from '../models/error.model.js';
import { BroadcastingService } from '../services/broadcasting.service.js';

const logger = LoggerService.getInstance();
const broadcastingService = BroadcastingService.getInstance();

export const startBroadcasting = async (req: Request, res: Response) => {
	const { broadcastUrl, roomName } = req.body;

	if (!roomName) {
		return res.status(400).json({ name: 'Recording Error', message: 'Room name is required for this operation' });
	}

	if (!broadcastUrl) {
		return res
			.status(400)
			.json({ name: 'Broadcasting Error', message: 'Broadcast URL is required for this operation' });
	}

	try {
		logger.info(`Starting broadcasting to ${broadcastUrl}`);
		const broadcastingInfo = await broadcastingService.startBroadcasting(roomName, broadcastUrl);
		return res.status(200).json(broadcastingInfo);
	} catch (error) {
		if (error instanceof OpenViduError) {
			logger.error(`Error starting broadcasting: ${error.message}`);
			return res.status(error.statusCode).json({ name: error.name, message: error.message });
		}

		return res.status(500).json({ name: 'Broadcasting Error', message: 'Unexpected error starting broadcasting' });
	}
};

export const stopBroadcasting = async (req: Request, res: Response) => {
	const egressId = req.params.broadcastId;

	if (!egressId) {
		return res
			.status(400)
			.json({ name: 'Broadcasting Error', message: 'Egress ID is required for this operation' });
	}

	try {
		logger.info(`Stopping broadcasting ${egressId}`);
		const broadcastingInfo = await broadcastingService.stopBroadcasting(egressId);
		return res.status(200).json(broadcastingInfo);
	} catch (error) {
		if (error instanceof OpenViduError) {
			logger.error(`Error stopping broadcasting: ${error.message}`);
			return res.status(error.statusCode).json({ name: error.name, message: error.message });
		}

		return res.status(500).json({ name: 'Broadcasting Error', message: 'Unexpected error stopping broadcasting' });
	}
};
