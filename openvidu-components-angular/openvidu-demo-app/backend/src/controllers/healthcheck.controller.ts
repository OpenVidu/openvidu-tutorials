import { Request, Response } from 'express';

export const healthCheck = async (req: Request, res: Response) => {
	return res.status(200).json({ message: 'Server is up and running' });
};
