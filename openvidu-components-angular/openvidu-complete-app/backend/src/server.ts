import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.routes.js';
import { livekitRouter } from './routes/livekit.routes.js';

import chalk from 'chalk';
import {
	LIVEKIT_URL,
	LIVEKIT_API_KEY,
	LIVEKIT_API_SECRET,
	SERVER_PORT,
	PRIVATE_ACCESS,
	SECRET,
	USER,
	ADMIN_SECRET,
	LIVEKIT_URL_PRIVATE,
	S3_BUCKET,
	S3_SERVICE_ENDPOINT,
	S3_ACCESS_KEY,
	S3_SECRET_KEY,
	ADMIN_USER,
	AWS_REGION,
	LOG_LEVEL,
	NAME_ID
} from './config.js';

const createApp = () => {
	const app = express();

	// Enable CORS support
	if (process.env.TESTING_MODE === 'ENABLED') {
		console.log('CORS enabled');
		app.use(cors({ origin: '*' }));
	}

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	app.use(express.static(path.join(__dirname, '../public/browser')));
	app.use(express.json());

	// Setup routes
	app.use('/completeapp/api', apiRouter);
	app.use('/livekit', livekitRouter);
	app.get(/^(?!\/api).*$/, (req: Request, res: Response) => {
		res.sendFile(path.join(__dirname, '../public/browser', 'index.html'));
	});

	return app;
};

const logEnvVars = () => {
	const credential = chalk.yellow;
	const text = chalk.cyanBright;
	const enabled = chalk.greenBright;
	const disabled = chalk.redBright;

	console.log(' ');
	console.log('---------------------------------------------------------');
	console.log('OpenVidu Complete App Server Configuration');
	console.log('---------------------------------------------------------');
	console.log('SERVICE NAME ID: ', text(NAME_ID));
	console.log('LOG LEVEL: ', text(LOG_LEVEL));
	console.log('PRIVATE ACCESS: ', PRIVATE_ACCESS === 'true' ? enabled(PRIVATE_ACCESS) : disabled(PRIVATE_ACCESS));

	if (PRIVATE_ACCESS === 'true') {
		console.log('USER: ', credential('****' + USER.slice(-3)));
		console.log('SECRET: ', credential('****' + SECRET.slice(-3)));
	}

	console.log('ADMIN USER: ', credential('****' + ADMIN_USER.slice(-3)));
	console.log('ADMIN PASSWORD: ', credential('****' + ADMIN_SECRET.slice(-3)));
	console.log('---------------------------------------------------------');
	console.log('LIVEKIT Configuration');
	console.log('---------------------------------------------------------');
	console.log('LIVEKIT URL: ', text(LIVEKIT_URL));
	console.log('LIVEKIT URL PRIVATE: ', text(LIVEKIT_URL_PRIVATE));
	console.log('LIVEKIT API SECRET: ', credential('****' + LIVEKIT_API_SECRET.slice(-3)));
	console.log('LIVEKIT API KEY: ', credential('****' + LIVEKIT_API_KEY.slice(-3)));
	console.log('---------------------------------------------------------');
	console.log('S3 Configuration');
	console.log('---------------------------------------------------------');
	console.log('S3 BUCKET:', text(S3_BUCKET));
	console.log('S3 SERVICE ENDPOINT:', text(S3_SERVICE_ENDPOINT));
	console.log('S3 ACCESS KEY:', credential('****' + S3_ACCESS_KEY.slice(-3)));
	console.log('S3 SECRET KEY:', credential('****' + S3_SECRET_KEY.slice(-3)));
	console.log('AWS REGION:', text(AWS_REGION));
	console.log('---------------------------------------------------------');
};

const startServer = (app: express.Application) => {
	app.listen(SERVER_PORT, () => {
		console.log(' ');
		console.log('---------------------------------------------------------');
		console.log(' ');
		console.log('OpenVidu Complete App Server is listening on port', chalk.cyanBright(SERVER_PORT));
		logEnvVars();
	});
};

const app = createApp();
startServer(app);
