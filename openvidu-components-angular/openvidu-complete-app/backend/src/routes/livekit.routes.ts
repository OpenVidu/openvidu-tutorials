import express, { Router } from 'express';
import { webhookHandler } from '../controllers/webhook.controller.js';

const livekitRouter = Router();

livekitRouter.use(express.raw({ type: 'application/webhook+json' }));
livekitRouter.post('/webhook', webhookHandler);

export { livekitRouter };
