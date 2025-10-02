import { Request, Response, NextFunction } from 'express';
import basicAuth from 'express-basic-auth';
import { DEMO_APP_ADMIN_SECRET, DEMO_APP_ADMIN_USER, DEMO_APP_PRIVATE_ACCESS, DEMO_APP_SECRET, DEMO_APP_USER } from '../config.js';

// Configure basic auth middleware for user and admin access
export const withAdminAndUserBasicAuth = (req: Request, res: Response, next: NextFunction) => {
	if (DEMO_APP_PRIVATE_ACCESS === 'true') {
		// Configure basic auth middleware if access is private
		const basicAuthMiddleware = basicAuth({
			users: {
				[DEMO_APP_USER]: DEMO_APP_SECRET,
				[DEMO_APP_ADMIN_USER]: DEMO_APP_ADMIN_SECRET
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
		[DEMO_APP_ADMIN_USER]: DEMO_APP_ADMIN_SECRET
	},
	challenge: true,
	unauthorizedResponse: () => 'Unauthorized'
});

// Configure basic auth middleware for user access
export const withUserBasicAuth = (req: Request, res: Response, next: NextFunction) => {
	if (DEMO_APP_PRIVATE_ACCESS === 'true') {
		// Configure basic auth middleware if access is private
		const basicAuthMiddleware = basicAuth({
			users: {
				[DEMO_APP_USER]: DEMO_APP_SECRET
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
		if (DEMO_APP_PRIVATE_ACCESS === 'true') {
			return username === DEMO_APP_USER && password === DEMO_APP_SECRET;
		}

		return true;
	}

	authenticateAdmin(username: string, password: string): boolean {
		return username === DEMO_APP_ADMIN_USER && password === DEMO_APP_ADMIN_SECRET;
	}
}
