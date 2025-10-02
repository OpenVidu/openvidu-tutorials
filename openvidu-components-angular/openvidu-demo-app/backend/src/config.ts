import dotenv from 'dotenv';

if (process.env.DEMO_APP_CONFIG_DIR) {
	dotenv.config({ path: process.env.DEMO_APP_CONFIG_DIR });
} else {
	dotenv.config();
}

// General server configuration
export const SERVER_PORT = process.env.SERVER_PORT || 6080;
export const SERVER_CORS_ORIGIN = process.env.SERVER_CORS_ORIGIN || '*';
export const DEMO_APP_NAME_ID = process.env.DEMO_APP_NAME_ID || 'OpenViduDemoApp';
export const DEMO_APP_PRIVATE_ACCESS = process.env.DEMO_APP_PRIVATE_ACCESS || 'false';
export const DEMO_APP_USER = process.env.DEMO_APP_USER || 'user';
export const DEMO_APP_SECRET = process.env.DEMO_APP_SECRET || 'user';
export const DEMO_APP_ADMIN_USER = process.env.DEMO_APP_ADMIN_USER || 'admin';
export const DEMO_APP_ADMIN_SECRET = process.env.DEMO_APP_ADMIN_SECRET || 'admin';

/**
 * Log levels configuration: error, warn, info, verbose, debug, silly
 *
 * The default log level is set to 'info' if DEMO_APP_LOG_LEVEL environment variable is not defined.
 */
export const DEMO_APP_LOG_LEVEL = process.env.DEMO_APP_LOG_LEVEL || 'info';

// Livekit configuration
export const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
export const LIVEKIT_URL_PRIVATE = process.env.LIVEKIT_URL_PRIVATE || LIVEKIT_URL;
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

// Storage provider: 's3' or 'azure'
export const DEMO_APP_STORAGE_PROVIDER = process.env.DEMO_APP_STORAGE_PROVIDER || 's3';

/* S3 configuration */
export const DEMO_APP_S3_BUCKET = process.env.DEMO_APP_S3_BUCKET || 'openvidu-appdata';
// Parent directory inside the bucket
export const DEMO_APP_S3_PARENT_DIRECTORY = process.env.DEMO_APP_S3_PARENT_DIRECTORY || 'openvidu-components-angular-demo-app';
// Recording directory inside the parent directory
export const DEMO_APP_S3_RECORDING_DIRECTORY = process.env.DEMO_APP_S3_RECORDING_DIRECTORY || 'recordings';
export const DEMO_APP_S3_SERVICE_ENDPOINT = process.env.DEMO_APP_S3_SERVICE_ENDPOINT || undefined;
export const DEMO_APP_S3_ACCESS_KEY = process.env.DEMO_APP_S3_ACCESS_KEY || undefined;
export const DEMO_APP_S3_SECRET_KEY = process.env.DEMO_APP_S3_SECRET_KEY || undefined;
export const DEMO_APP_AWS_REGION = process.env.DEMO_APP_AWS_REGION || undefined;
export const DEMO_APP_S3_WITH_PATH_STYLE_ACCESS = process.env.DEMO_APP_S3_WITH_PATH_STYLE_ACCESS || 'true';

/* Azure Blob storage configuration*/
export const DEMO_APP_AZURE_CONTAINER_NAME = process.env.DEMO_APP_AZURE_CONTAINER_NAME || 'openvidu-appdata';
export const DEMO_APP_AZURE_ACCOUNT_NAME = process.env.DEMO_APP_AZURE_ACCOUNT_NAME || undefined;
export const DEMO_APP_AZURE_ACCOUNT_KEY = process.env.DEMO_APP_AZURE_ACCOUNT_KEY || undefined;

// Deployment related configuration
export const MODULES_FILE = process.env.MODULES_FILE || undefined;
export const MODULE_NAME = process.env.MODULE_NAME || 'app';
export const ENABLED_MODULES = process.env.ENABLED_MODULES || '';
