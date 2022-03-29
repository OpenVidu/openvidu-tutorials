
import * as express from 'express';
import { Request, Response } from 'express';
import { Session } from 'openvidu-node-client';
import { OpenViduService } from '../services/OpenViduService';
export const app = express.Router({
    strict: true
});

const openviduService = new OpenViduService();

app.post('/', async (req: Request, res: Response) => {
	let sessionId: string = req.body.sessionId;
	let nickname: string = req.body.nickname;
	let createdSession: Session = null;
	console.log('Session ID received', sessionId);
	try {
		createdSession = await openviduService.createSession(sessionId);
	} catch (error) {
		handleError(error, res);
		return;
	}
	try {
		const connection = await openviduService.createConnection(createdSession, nickname);
		res.status(200).send(JSON.stringify(connection.token));
	} catch (error) {
		handleError(error, res);
	}
});

function handleError(error: any, res: Response){
	try {
		let statusCode = parseInt(error.message);
		res.status(parseInt(error.message)).send(`OpenVidu Server returned an error to OpenVidu Call Server: ${statusCode}`)
	} catch (error) {
		res.status(503).send('Cannot connect with OpenVidu Server');
	}
}
