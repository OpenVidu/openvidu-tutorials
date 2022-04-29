import * as express from 'express';
import { SERVER_PORT, OPENVIDU_URL, OPENVIDU_SECRET, CALL_OPENVIDU_CERTTYPE, ADMIN_SECRET, RECORDING } from './config';
import { app as sessionController } from './controllers/SessionController';
import { app as adminController } from './controllers/AdminController';
import { app as recordingController, proxyGETRecording } from './controllers/RecordingController';

import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import * as cookieSession from 'cookie-session';

dotenv.config();
const app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(cookieParser());
app.use(
	cookieSession({
		name: 'session',
		keys: [ADMIN_SECRET],
		maxAge: 24 * 60 * 60 * 1000 // 24 hours
	})
);

app.use('/sessions', sessionController);
app.use('/recordings', recordingController);
app.use('/recordings/:recordingId', proxyGETRecording);
app.use('/admin', adminController);

// Accept selfsigned certificates if CALL_OPENVIDU_CERTTYPE=selfsigned
if (CALL_OPENVIDU_CERTTYPE === 'selfsigned') {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
app.listen(SERVER_PORT, () => {
	console.log('---------------------------------------------------------');
	console.log(' ');
	console.log(`OPENVIDU URL: ${OPENVIDU_URL}`);
	console.log(`OPENVIDU SECRET: ${OPENVIDU_SECRET}`);
	console.log(`CALL OPENVIDU CERTTYPE: ${CALL_OPENVIDU_CERTTYPE}`);
	console.log(`CALL RECORDING: ${RECORDING}`);
	console.log(`CALL ADMIN PASSWORD: ${ADMIN_SECRET}`);
	console.log(`OpenVidu Call Server is listening on port ${SERVER_PORT}`);
	console.log(' ');
	console.log('---------------------------------------------------------');
});
