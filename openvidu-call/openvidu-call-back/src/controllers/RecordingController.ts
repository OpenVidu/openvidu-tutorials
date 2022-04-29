import { CALL_OPENVIDU_CERTTYPE, OPENVIDU_URL, RECORDING } from '../config';

import * as express from 'express';
import { Request, Response } from 'express';
import { Recording } from 'openvidu-node-client';
import { OpenViduService } from '../services/OpenViduService';
import { createProxyMiddleware } from 'http-proxy-middleware';
export const app = express.Router({
	strict: true
});

const openviduService = OpenViduService.getInstance();

app.get('/', async (req: Request, res: Response) => {
	try {
		const IS_RECORDING_ENABLED = RECORDING.toUpperCase() === 'ENABLED';
		const sessionId = openviduService.getSessionIdFromCookie(req.cookies);
		const isAdminDashboard = openviduService.adminTokens.includes(req['session'].token);
		let recordings = [];
		if ((!!sessionId && IS_RECORDING_ENABLED && openviduService.isValidToken(sessionId, req.cookies)) || isAdminDashboard) {
			if (isAdminDashboard) {
				recordings = await openviduService.listAllRecordings(true);
			} else {
				const date = openviduService.getDateFromCookie(req.cookies);
				recordings = await openviduService.listRecordingsBySessionIdAndDate(sessionId, date);
			}
			console.log('a', recordings)
			res.status(200).send(JSON.stringify(recordings));
		} else {
			const message = IS_RECORDING_ENABLED ? 'Permissions denied to drive recording' : 'Recording is disabled';
			res.status(403).send(JSON.stringify({ message }));
		}
	} catch (error) {
		console.log(error);
		const code = Number(error?.message);
		let message = 'Unexpected error getting all recordings';
		if (code === 404) {
			message = 'No recording exist for the session';
		}
		return res.status(Number(code) || 500).send(JSON.stringify({ message }));
	}
});

app.post('/start', async (req: Request, res: Response) => {
	try {
		let sessionId: string = req.body.sessionId;
		if (openviduService.isValidToken(sessionId, req.cookies)) {
			let startingRecording: Recording = null;
			console.log(`Starting recording in ${sessionId}`);
			startingRecording = await openviduService.startRecording(sessionId);
			openviduService.recordingMap.get(sessionId).recordingId = startingRecording.id;
			res.status(200).send(JSON.stringify(startingRecording));
		} else {
			console.log(`Permissions denied for starting recording in session ${sessionId}`);
			res.status(403).send(JSON.stringify({ message: 'Permissions denied to drive recording' }));
		}
	} catch (error) {
		console.log(error);
		const code = Number(error?.message);
		let message = `Unexpected error starting recording`;
		if (code === 409) {
			message = 'The session is already being recorded.';
		} else if (code === 501) {
			message = 'OpenVidu Server recording module is disabled';
		} else if (code === 406) {
			message = 'The session has no connected participants';
		}
		return res.status(code || 500).send(JSON.stringify({ message }));
	}
});

app.post('/stop', async (req: Request, res: Response) => {
	try {
		let sessionId: string = req.body.sessionId;
		if (openviduService.isValidToken(sessionId, req.cookies)) {
			const recordingId = openviduService.recordingMap.get(sessionId)?.recordingId;

			if (!!recordingId) {
				console.log(`Stopping recording in ${sessionId}`);
				await openviduService.stopRecording(recordingId);
				const date = openviduService.getDateFromCookie(req.cookies);
				const recordingList = await openviduService.listRecordingsBySessionIdAndDate(sessionId, date);
				openviduService.recordingMap.get(sessionId).recordingId = '';
				res.status(200).send(JSON.stringify(recordingList));
			} else {
				res.status(404).send(JSON.stringify({ message: 'Session was not being recorded' }));
			}
		} else {
			res.status(403).send(JSON.stringify({ message: 'Permissions denied to drive recording' }));
		}
	} catch (error) {
		console.log(error);
		const code = Number(error?.message);
		let message = `Unexpected error stopping recording`;
		if (code === 501) {
			message = 'OpenVidu Server recording module is disabled';
		} else if (code === 406) {
			message = 'Recording has STARTING status. Wait until STARTED status before stopping the recording';
		}
		return res.status(code || 500).send(JSON.stringify({ message }));
	}
});

app.delete('/delete/:recordingId', async (req: Request, res: Response) => {
	try {
		const sessionId = openviduService.getSessionIdFromCookie(req.cookies);
		const isAdminDashboard = openviduService.adminTokens.includes(req['session'].token);
		let recordings = [];
		if ((!!sessionId && openviduService.isValidToken(sessionId, req.cookies)) || isAdminDashboard) {
			console.log('DELETE RECORDING');
			const recordingId: string = req.params.recordingId;
			if (!recordingId) {
				return res.status(400).send('Missing recording id parameter.');
			}
			await openviduService.deleteRecording(recordingId);
			if (isAdminDashboard) {
				recordings = await openviduService.listAllRecordings(true);
			} else {
				const date = openviduService.getDateFromCookie(req.cookies);
				recordings = await openviduService.listRecordingsBySessionIdAndDate(sessionId, date);
			}
			res.status(200).send(JSON.stringify(recordings));
		} else {
			res.status(403).send(JSON.stringify({ message: 'Permissions denied to drive recording' }));
		}
	} catch (error) {
		console.log(error);
		const code = Number(error?.message);
		let message = `Unexpected error deleting the recording`;
		if (code === 409) {
			message = 'The recording has STARTED status. Stop it before deletion.';
		} else if (code === 501) {
			message = 'OpenVidu Server recording module is disabled';
		} else if (code === 409) {
			message = 'No recording exists for the session';
		}
		return res.status(code).send(JSON.stringify({ message }));
	}
});

export const proxyGETRecording = createProxyMiddleware({
	target: `${OPENVIDU_URL}/openvidu/recordings/`,
	secure: CALL_OPENVIDU_CERTTYPE !== 'selfsigned',
	pathRewrite: (path, req) => {
		return `${req.params.recordingId}/${req.params.recordingId}.mp4`;
	},
	onProxyReq: (proxyReq, req: Request, res: Response) => {
		const isAdminDashboard = openviduService.adminTokens.includes(req['session'].token);
		const sessionId = openviduService.getSessionIdFromCookie(req.cookies);
		if ((!!sessionId && openviduService.isValidToken(sessionId, req.cookies)) || isAdminDashboard) {
			const recordingId: string = req.params.recordingId;
			if (!recordingId) {
				return res.status(400).send(JSON.stringify({ message: 'Missing recording id parameter.' }));
			} else {
				proxyReq.setHeader('Authorization', openviduService.getBasicAuth());
				proxyReq.setHeader('Range', 'bytes=0-');
			}
		} else {
			return res.status(403).send(JSON.stringify({ message: 'Permissions denied to drive recording' }));
		}
	},
	onError: (error, req: Request, res: Response) => {
		console.log(error);
		const code = Number(error?.message);
		let message = 'Unexpected error downloading the recording';
		if (code === 404) {
			message = 'No recording exist for the session';
		}
		res.status(Number(code) || 500).send(JSON.stringify({ message }));
		return res.end();
	}
});
