import { Request, Response, NextFunction } from 'express';
import basicAuth from 'express-basic-auth';
import { ADMIN_SECRET, ADMIN_USER, PRIVATE_ACCESS, SECRET, USER } from '../config.js';

// Configure basic auth middleware for user and admin access
export const withAdminAndUserBasicAuth = (req: Request, res: Response, next: NextFunction) => {
	if (PRIVATE_ACCESS === 'true') {
		// Configure basic auth middleware if access is private
		const basicAuthMiddleware = basicAuth({
			users: {
				[USER]: SECRET,
				[ADMIN_USER]: ADMIN_SECRET
			},
			challenge: true,
			unauthorizedResponse: () => 'Unauthorized'
		});
		return basicAuthMiddleware(req, res, next);
	} else {
		// Skip basic auth if access is public
		next();
	}
};

// Configure basic auth middleware for admin access
export const withAdminBasicAuth = basicAuth({
	users: {
		[ADMIN_USER]: ADMIN_SECRET
	},
	challenge: true,
	unauthorizedResponse: () => 'Unauthorized'
});

// Configure basic auth middleware for user access
export const withUserBasicAuth = (req: Request, res: Response, next: NextFunction) => {
	if (PRIVATE_ACCESS === 'true') {
		// Configure basic auth middleware if access is private
		const basicAuthMiddleware = basicAuth({
			users: {
				[USER]: SECRET
			},
			challenge: true,
			unauthorizedResponse: () => 'Unauthorized'
		});
		return basicAuthMiddleware(req, res, next);
	} else {
		// Skip basic auth if access is public
		next();
	}
};

export class AuthService {
	protected static instance: AuthService;

	private constructor() {}

	static getInstance() {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}

		return AuthService.instance;
	}

	authenticateUser(username: string, password: string): boolean {
		if (PRIVATE_ACCESS === 'true') {
			return username === USER && password === SECRET;
		}

		return true;
	}

	authenticateAdmin(username: string, password: string): boolean {
		return username === ADMIN_USER && password === ADMIN_SECRET;
	}
}
