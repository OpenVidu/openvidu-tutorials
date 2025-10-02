import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter, livekitRouter } from './routes/index.js';
import chalk from 'chalk';
import {
	LIVEKIT_URL,
	LIVEKIT_API_KEY,
	LIVEKIT_API_SECRET,
	SERVER_PORT,
	DEMO_APP_PRIVATE_ACCESS,
	DEMO_APP_SECRET,
	DEMO_APP_USER,
	DEMO_APP_ADMIN_SECRET,
	LIVEKIT_URL_PRIVATE,
	DEMO_APP_S3_BUCKET,
	DEMO_APP_S3_SERVICE_ENDPOINT,
	DEMO_APP_S3_ACCESS_KEY,
	DEMO_APP_S3_SECRET_KEY,
	DEMO_APP_ADMIN_USER,
	DEMO_APP_AWS_REGION,
	DEMO_APP_LOG_LEVEL,
	DEMO_APP_NAME_ID,
	SERVER_CORS_ORIGIN,
	DEMO_APP_S3_PARENT_DIRECTORY,
	DEMO_APP_S3_RECORDING_DIRECTORY,
	MODULES_FILE,
	ENABLED_MODULES,
	MODULE_NAME,
	DEMO_APP_AZURE_ACCOUNT_KEY,
	DEMO_APP_AZURE_ACCOUNT_NAME,
	DEMO_APP_AZURE_CONTAINER_NAME,
	DEMO_APP_STORAGE_PROVIDER
} from './config.js';

const createApp = () => {
	const app = express();

	// Enable CORS support
	if (SERVER_CORS_ORIGIN) {
		console.log('CORS Origin:', SERVER_CORS_ORIGIN);
		app.use(cors({ origin: SERVER_CORS_ORIGIN }));
	}

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	app.use(express.static(path.join(__dirname, '../public/browser')));
	app.use(express.json());

	// Setup routes
	app.use('/call/api', apiRouter);
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
	console.log('OpenVidu Demo App Server Configuration');
	console.log('---------------------------------------------------------');
	console.log('SERVICE NAME ID: ', text(DEMO_APP_NAME_ID));
	console.log('DEMO_APP LOG LEVEL: ', text(DEMO_APP_LOG_LEVEL));
	console.log(
		'DEMO_APP PRIVATE ACCESS: ',
		DEMO_APP_PRIVATE_ACCESS === 'true' ? enabled(DEMO_APP_PRIVATE_ACCESS) : disabled(DEMO_APP_PRIVATE_ACCESS)
	);

	if (DEMO_APP_PRIVATE_ACCESS === 'true') {
		console.log('DEMO_APP USER: ', credential('****' + DEMO_APP_USER.slice(-3)));
		console.log('DEMO_APP SECRET: ', credential('****' + DEMO_APP_SECRET.slice(-3)));
	}

	console.log('DEMO_APP ADMIN USER: ', credential('****' + DEMO_APP_ADMIN_USER.slice(-3)));
	console.log('DEMO_APP ADMIN PASSWORD: ', credential('****' + DEMO_APP_ADMIN_SECRET.slice(-3)));
	console.log('---------------------------------------------------------');
	console.log('LIVEKIT Configuration');
	console.log('---------------------------------------------------------');
	console.log('LIVEKIT URL: ', text(LIVEKIT_URL));
	console.log('LIVEKIT URL PRIVATE: ', text(LIVEKIT_URL_PRIVATE));
	console.log('LIVEKIT API SECRET: ', credential('****' + LIVEKIT_API_SECRET.slice(-3)));
	console.log('LIVEKIT API KEY: ', credential('****' + LIVEKIT_API_KEY.slice(-3)));
	console.log('---------------------------------------------------------');

	console.log('Storage Provider:', text(DEMO_APP_STORAGE_PROVIDER.toUpperCase()));
	console.log('---------------------------------------------------------');

	if (DEMO_APP_STORAGE_PROVIDER === 's3') {
		console.log('S3 Configuration');
		console.log('---------------------------------------------------------');
		console.log('DEMO_APP S3 BUCKET:', text(DEMO_APP_S3_BUCKET));
		console.log('DEMO_APP S3 DIRECTORY:', text(DEMO_APP_S3_PARENT_DIRECTORY));
		console.log('DEMO_APP S3 RECORDING DIRECTORY:', text(`${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}`));

		// S3 configuration
		if (DEMO_APP_S3_SERVICE_ENDPOINT) {
			console.log('DEMO_APP S3 SERVICE ENDPOINT:', text(DEMO_APP_S3_SERVICE_ENDPOINT));
		}

		if (DEMO_APP_S3_ACCESS_KEY) {
			console.log('DEMO_APP S3 ACCESS KEY:', credential('****' + DEMO_APP_S3_ACCESS_KEY.slice(-3)));
		}

		if (DEMO_APP_S3_SECRET_KEY) {
			console.log('DEMO_APP S3 SECRET KEY:', credential('****' + DEMO_APP_S3_SECRET_KEY.slice(-3)));
		}

		if (DEMO_APP_AWS_REGION) {
			console.log('DEMO_APP AWS REGION:', text(DEMO_APP_AWS_REGION));
		}
	} else if (DEMO_APP_STORAGE_PROVIDER === 'azure') {
		console.log('Azure Blob Storage Configuration');
		console.log('---------------------------------------------------------');
		console.log('AZURE ACCOUNT NAME:', text(DEMO_APP_AZURE_ACCOUNT_NAME));
		console.log('AZURE CONTAINER NAME:', text(DEMO_APP_AZURE_CONTAINER_NAME));

		if (DEMO_APP_AZURE_ACCOUNT_KEY) {
			console.log('AZURE ACCOUNT KEY:', credential('****' + DEMO_APP_AZURE_ACCOUNT_KEY.slice(-3)));
		}
	}

	console.log('---------------------------------------------------------');
};

const startServer = (app: express.Application) => {
	app.listen(SERVER_PORT, () => {
		console.log(' ');
		console.log('---------------------------------------------------------');
		console.log(' ');
		console.log('OpenVidu Demo App Server is listening on port', chalk.cyanBright(SERVER_PORT));
		logEnvVars();
	});
};

/**
 * Determines if the current module is the main entry point of the application.
 * @returns {boolean} True if this module is the main entry point, false otherwise.
 */
const isMainModule = (): boolean => {
	const importMetaUrl = import.meta.url;
	let processArgv1 = process.argv[1];

	if (process.platform === 'win32') {
		processArgv1 = processArgv1.replace(/\\/g, '/');
		processArgv1 = `file:///${processArgv1}`;
	} else {
		processArgv1 = `file://${processArgv1}`;
	}

	return importMetaUrl === processArgv1;
};

const checkModuleIsEnabled = () => {
	if (MODULES_FILE) {
		const moduleName = MODULE_NAME;
		const enabledModules = ENABLED_MODULES.split(',').map((module) => module.trim());

		if (!enabledModules.includes(moduleName)) {
			console.error(`Module ${moduleName} is not enabled`);
			process.exit(0);
		}
	}
};

if (isMainModule()) {
	checkModuleIsEnabled();
	const app = createApp();
	startServer(app);
}

export { logEnvVars };
