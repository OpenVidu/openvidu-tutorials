import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { LoggerService } from '../services/logger.service.js';

const authService = AuthService.getInstance();
const logger = LoggerService.getInstance();

export const login = (req: Request, res: Response) => {
	logger.verbose('Login request received');
	const { username, password } = req.body;

	if (!username || !password) {
		logger.warn('Missing username or password');
		return res.status(400).json({ message: 'Missing username or password' });
	}

	const authenticated = authService.authenticateUser(username, password);

	if (!authenticated) {
		logger.warn('Login failed');
		return res.status(401).json({ message: 'Login failed' });
	}

	return res.status(200).json({ message: 'Login succeeded' });
};

export const logout = (req: Request, res: Response) => {
	return res.status(200).json({ message: 'Logout successful' });
};

export const adminLogin = (req: Request, res: Response) => {
	logger.verbose('Admin login request received');
	const { username, password } = req.body;

	if (!username || !password) {
		logger.warn('Missing username or password');
		return res.status(400).json({ message: 'Missing username or password' });
	}

	const authenticated = authService.authenticateAdmin(username, password);

	if (!authenticated) {
		logger.warn('Admin login failed');
		return res.status(401).json({ message: 'Admin login failed' });
	}

	logger.info('Admin login succeeded');
	return res.status(200).json({ message: 'Admin login succeeded' });
};

export const adminLogout = (req: Request, res: Response) => {
	return res.status(200).json({ message: 'Logout successful' });
};
