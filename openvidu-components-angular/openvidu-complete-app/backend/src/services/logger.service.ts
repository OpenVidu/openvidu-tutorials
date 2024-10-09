import winston from 'winston';
import { LOG_LEVEL } from '../config.js';

export class LoggerService {
	private static instance: LoggerService;
	public readonly logger: winston.Logger;

	private constructor() {
		this.logger = winston.createLogger({
			level: LOG_LEVEL,
			format: winston.format.combine(
				winston.format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss'
				}),
				winston.format.printf((info) => {
					return `${info.timestamp} [${info.level}] ${info.message}`;
				}),
				winston.format.errors({ stack: true }),
			)
		});

		if (process.env.NODE_ENV !== 'production') {
			this.logger.add(
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.colorize(),
						winston.format.printf((info) => {
							return `${info.timestamp} [${info.level}] ${info.message}`;
						})
					)
				})
			);
		}
	}

	public static getInstance(): LoggerService {
		if (!LoggerService.instance) {
			LoggerService.instance = new LoggerService();
		}

		return LoggerService.instance;
	}

	// Generic method to log messages with a specific level
	public log(level: string, message: string): void {
		this.logger.log(level, message);
	}

	// Logs a message as an error
	public error(message: string): void {
		this.log('error', message);
	}

	// Logs a message as a warning
	public warn(message: string): void {
		this.log('warn', message);
	}

	// Logs a message as general information
	public info(message: string): void {
		this.log('info', message);
	}

	// Logs a message as verbose
	public verbose(message: string): void {
		this.log('verbose', message);
	}

	// Logs a message for debugging purposes
	public debug(message: string): void {
		this.log('debug', message);
	}

	// Logs a message as trivial information
	public silly(message: string): void {
		this.log('silly', message);
	}
}
