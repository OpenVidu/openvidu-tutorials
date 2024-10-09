
import dotenv from 'dotenv';

if (process.env.CONFIG_DIR) {
    dotenv.config({ path: process.env.CONFIG_DIR });
} else {
    dotenv.config();
}

// General server configuration
export const SERVER_PORT = process.env.SERVER_PORT || 6080;
export const NAME_ID = process.env.NAME_ID || 'OpenViduCompleteApp';
export const PRIVATE_ACCESS = process.env.PRIVATE_ACCESS || 'false';
export const USER = process.env.USER || 'user';
export const SECRET = process.env.SECRET || 'user';
export const ADMIN_USER = process.env.ADMIN_USER || 'admin';
export const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin';

/**
 * Log levels configuration: error, warn, info, verbose, debug, silly
 *
 * The default log level is set to 'verbose' if LOG_LEVEL environment variable is not defined.
 */
export const LOG_LEVEL = process.env.LOG_LEVEL || 'verbose';

// Livekit configuration
export const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
export const LIVEKIT_URL_PRIVATE = process.env.LIVEKIT_URL_PRIVATE || LIVEKIT_URL;
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

// S3 configuration
export const S3_BUCKET = process.env.S3_BUCKET || 'openvidu';
export const S3_SERVICE_ENDPOINT = process.env.S3_SERVICE_ENDPOINT || 'http://localhost:9000';
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const S3_WITH_PATH_STYLE_ACCESS = process.env.S3_WITH_PATH_STYLE_ACCESS || 'true';
