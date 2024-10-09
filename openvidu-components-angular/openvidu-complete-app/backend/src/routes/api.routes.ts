import { Router } from 'express';
import bodyParser from 'body-parser';
import * as roomCtrl from '../controllers/room.controller.js';
import * as recordingCtrl from '../controllers/recording.controller.js';
import * as broadcastCtrl from '../controllers/broadcasting.controller.js';
import * as authCtrl from '../controllers/auth.controller.js';
import { getConfig } from '../controllers/config.controller.js';
import { healthCheck } from '../controllers/healthcheck.controller.js';
import { withAdminAndUserBasicAuth, withAdminBasicAuth, withUserBasicAuth } from '../services/auth.service.js';

const apiRouter = Router();

apiRouter.use(bodyParser.urlencoded({ extended: true }));
apiRouter.use(bodyParser.json());

// Room Routes
apiRouter.post('/rooms', withUserBasicAuth, roomCtrl.createRoom);

// Recording Routes
apiRouter.post('/recordings', withUserBasicAuth, recordingCtrl.startRecording);
apiRouter.put('/recordings/:recordingId', withUserBasicAuth, recordingCtrl.stopRecording);
apiRouter.get('/recordings/:recordingId/stream', recordingCtrl.streamRecording);
apiRouter.delete('/recordings/:recordingId', withUserBasicAuth, recordingCtrl.deleteRecording);

apiRouter.get('/admin/recordings', withAdminBasicAuth, recordingCtrl.getAllRecordings);
apiRouter.delete('/admin/recordings/:recordingId', withAdminBasicAuth, recordingCtrl.deleteRecording);

// Broadcasting Routes
apiRouter.post('/broadcasts', withUserBasicAuth, broadcastCtrl.startBroadcasting);
apiRouter.put('/broadcasts/:broadcastId', withUserBasicAuth, broadcastCtrl.stopBroadcasting);

// Auth Routes
apiRouter.post('/login', authCtrl.login);
apiRouter.post('/logout', authCtrl.logout);
apiRouter.post('/admin/login', authCtrl.adminLogin);
apiRouter.post('/admin/logout', authCtrl.adminLogout);

// Config Routes
apiRouter.get('/config', getConfig);

// Health Check Route
apiRouter.get('/healthcheck', withAdminAndUserBasicAuth, healthCheck);

export { apiRouter };
