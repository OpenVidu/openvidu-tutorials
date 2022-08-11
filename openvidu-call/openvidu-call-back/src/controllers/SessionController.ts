import * as express from 'express';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { OpenViduRole, Session } from 'openvidu-node-client';
import { OpenViduService } from '../services/OpenViduService';
import { RECORDING } from '../config';

export const app = express.Router({
	strict: true
});

const openviduService = OpenViduService.getInstance();

app.post('/', async (req: Request, res: Response) => {
	try {
		console.log('Session ID received', req.body.sessionId);

		let sessionId: string = req.body.sessionId;
		let nickname: string = req.body.nickname;
		let date = null;
		let sessionCreated: Session = await openviduService.createSession(sessionId);
		const RECORDING_TOKEN_NAME = openviduService.RECORDING_TOKEN_NAME;
		const IS_RECORDING_ENABLED = RECORDING.toUpperCase() === 'ENABLED';
		const hasValidToken = openviduService.isValidToken(sessionId, req.cookies);
		const isSessionCreator = hasValidToken || sessionCreated.activeConnections.length === 0;
		const role: OpenViduRole = isSessionCreator && IS_RECORDING_ENABLED ? OpenViduRole.MODERATOR : OpenViduRole.PUBLISHER;
		const response = {cameraToken : '', screenToken: '', recordingEnabled: IS_RECORDING_ENABLED, recordings: []};
		const cameraConnection = await openviduService.createConnection(sessionCreated, nickname, role);
		const screenConnection = await openviduService.createConnection(sessionCreated, nickname, role);
		response.cameraToken = cameraConnection.token;
		response.screenToken = screenConnection.token;

		if (IS_RECORDING_ENABLED && isSessionCreator && !hasValidToken) {
			/**
			 * ! *********** WARN *********** !
			 *
			 * To identify who is able to manage session recording, the code sends a cookie with a token to the session creator.
			 * The relation between cookies and sessions are stored in backend memory.
			 *
			 * This authentication & authorization system is pretty basic and it is not for production.
			 * We highly recommend IMPLEMENT YOUR OWN USER MANAGEMENT with persistence for a properly and secure recording feature.
			 *
			 * ! *********** WARN *********** !
			 **/
			const uuid = crypto.randomBytes(32).toString('hex');
			date = Date.now();
			const recordingToken = `${response.cameraToken}&${RECORDING_TOKEN_NAME}=${uuid}&createdAt=${date}`;
			res.cookie(RECORDING_TOKEN_NAME, recordingToken);
			openviduService.recordingMap.set(sessionId, { token: recordingToken, recordingId: '' });
		}

		if(IS_RECORDING_ENABLED){
			date = date || openviduService.getDateFromCookie(req.cookies);
			try {
				response.recordings = await openviduService.listRecordingsBySessionIdAndDate(sessionId, date);
			} catch (error) {
				if(error.message === '501'){
					console.log('Recording is diasbled in OpenVidu Server. Disabling it in OpenVidu Call');
					response.recordings = [];
					response.recordingEnabled = false;
				}
			}
		}

		res.status(200).send(JSON.stringify(response));
	} catch (error) {
		console.error(error);
		let message = 'Cannot connect with OpenVidu Server';
		let code = Number(error?.message);
		if(error.message === 500){
			message = 'Unexpected error when creating the Connection object.'
		} else if (error.message === 404){
			message = 'No session exists';
		}
		if(typeof code !== 'number') {
			code = 503
		}
		res.status(code).send({ message });
	}
});
