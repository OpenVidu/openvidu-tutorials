import * as express from 'express';
import * as crypto from 'crypto';
import { Request, Response } from 'express';

import { OpenViduService } from '../services/OpenViduService';
import { ADMIN_SECRET } from '../config';

export const app = express.Router({
	strict: true
});

const openviduService = OpenViduService.getInstance();

app.post('/login', async (req: Request, res: Response) => {
	const password = req.body.password;
	const isAdminTokenValid = openviduService.adminTokens.includes(req['session']?.token);
	const isAuthValid = password === ADMIN_SECRET || isAdminTokenValid;
	if (isAuthValid) {
		try {
			if (!req['session']?.token || !openviduService.adminTokens.includes(req['session']?.token)) {
				// Save session token
				const token = crypto.randomBytes(32).toString('hex');
				res.cookie(openviduService.ADMIN_TOKEN_NAME, token);
				req['session'] = { token };
				openviduService.adminTokens.push(token);
			}
			const recordings = await openviduService.listAllRecordings();
			console.log(`${recordings.length} recordings found`);
			res.status(200).send(JSON.stringify({ recordings }));
		} catch (error) {
			const code = Number(error?.message);
			if(code === 501){
				console.log('501. OpenVidu Server recording module is disabled.');
				res.status(200).send();
			} else {
				console.error(error);
				res.status(500).send('Unexpected error getting recordings');
			}
		}
	} else {
		res.status(403).send('Permissions denied');
	}
});

app.post('/logout', async (req: Request, res: Response) => {
	openviduService.adminTokens = openviduService.adminTokens.filter((token) => token !== req['session'].token);
	req['session'] = {};
});
