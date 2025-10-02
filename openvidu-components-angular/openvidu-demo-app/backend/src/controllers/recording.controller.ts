import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service.js';
import { OpenViduDemoAppError } from '../models/error.model.js';
import { RecordingService } from '../services/recording.service.js';

const recordingService = RecordingService.getInstance();
const logger = LoggerService.getInstance();

export const startRecording = async (req: Request, res: Response) => {
	const roomName = req.body.roomName;

	if (!roomName) {
		return res.status(400).json({ name: 'Recording Error', message: 'Room name is required for this operation' });
	}

	try {
		logger.info(`Starting recording in ${roomName}`);
		const recordingInfo = await recordingService.startRecording(roomName);
		return res.status(200).json(recordingInfo);
	} catch (error) {
		if (error instanceof OpenViduDemoAppError) {
			logger.error(`Error starting recording: ${error.message}`);
			return res.status(error.statusCode).json({ name: error.name, message: error.message });
		}

		return res.status(500).json({ name: 'Recording Error', message: 'Failed to start recording' });
	}
};

export const stopRecording = async (req: Request, res: Response) => {
	const recordingId = req.params.recordingId;

	if (!recordingId) {
		return res
			.status(400)
			.json({ name: 'Recording Error', message: 'Recording ID is required for this operation' });
	}

	try {
		logger.info(`Stopping recording ${recordingId}`);
		const recordingInfo = await recordingService.stopRecording(recordingId);
		return res.status(200).json(recordingInfo);
	} catch (error) {
		if (error instanceof OpenViduDemoAppError) {
			logger.error(`Error stopping recording: ${error.message}`);
			return res.status(error.statusCode).json({ name: error.name, message: error.message });
		}

		return res.status(500).json({ name: 'Recording Error', message: 'Unexpected error stopping recording' });
	}
};

/**
 * Endpoint only available for the admin user
 * !WARNING: This will be removed in future versions
 */
export const getAllRecordings = async (req: Request, res: Response) => {
	try {
		logger.info('Getting all recordings');
		// const continuationToken = req.query.continuationToken as string;
		const response = await recordingService.getAllRecordings();
		return res
			.status(200)
			.json({ recordings: response.recordingInfo, continuationToken: response.continuationToken });
	} catch (error) {
		if (error instanceof OpenViduDemoAppError) {
			logger.error(`Error getting all recordings: ${error.message}`);
			return res.status(error.statusCode).json({ name: error.name, message: error.message });
		}

		return res.status(500).json({ name: 'Recording Error', message: 'Unexpected error getting recordings' });
	}
};

export const streamRecording = async (req: Request, res: Response) => {
	const recordingId = req.params.recordingId;
	const range = req.headers.range;

	if (!recordingId) {
		return res
			.status(400)
			.json({ name: 'Recording Error', message: 'Recording ID is required for this operation' });
	}

	try {
		logger.info(`Streaming recording ${recordingId}`);
		const { fileSize, fileStream, start, end } = await recordingService.getRecordingAsStream(recordingId, range);

		if (range && fileSize && start !== undefined && end !== undefined) {
			const contentLength = end - start + 1;

			res.writeHead(206, {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': contentLength,
				'Content-Type': 'video/mp4'
			});

			fileStream.on('error', (streamError) => {
				logger.error(`Error while streaming the file: ${streamError.message}`);
				res.end();
			});

			fileStream.pipe(res).on('finish', () => res.end());
		} else {
			res.setHeader('Accept-Ranges', 'bytes');
			res.setHeader('Content-Type', 'video/mp4');

			if (fileSize) res.setHeader('Content-Length', fileSize);

			fileStream.pipe(res).on('finish', () => res.end());
		}
	} catch (error) {
		if (error instanceof OpenViduDemoAppError) {
			logger.error(`Error streaming recording: ${error.message}`);
			return res.status(error.statusCode).json({ name: error.name, message: error.message });
		}

		return res.status(500).json({ name: 'Recording Error', message: 'Unexpected error streaming recording' });
	}
};

export const deleteRecording = async (req: Request, res: Response) => {
	const recordingId = req.params.recordingId;

	if (!recordingId) {
		return res
			.status(400)
			.json({ name: 'Recording Error', message: 'Recording ID is required for this operation' });
	}

	try {
		logger.info(`Deleting recording ${recordingId}`);
		const isRequestedByAdmin = req.url.includes('admin');
		const recordingInfo = await recordingService.deleteRecording(recordingId, isRequestedByAdmin);

		return res.status(204).json(recordingInfo);
	} catch (error) {
		if (error instanceof OpenViduDemoAppError) {
			logger.error(`Error deleting recording: ${error.message}`);
			return res.status(error.statusCode).json({ name: error.name, message: error.message });
		}

		return res.status(500).json({ name: 'Recording Error', message: 'Unexpected error deleting recording' });
	}
};
