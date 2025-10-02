import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service.js';
import { WebhookService } from '../services/webhook.service.js';
import { RoomService } from '../services/room.service.js';
import { WebhookEvent } from 'livekit-server-sdk';

const webhookService = WebhookService.getInstance();
const roomService = RoomService.getInstance();
const logger = LoggerService.getInstance();

export const webhookHandler = async (req: Request, res: Response) => {
	try {
		const webhookEvent: WebhookEvent = await webhookService.getEventFromWebhook(
			req.body,
			req.get('Authorization')!
		);

		const { event: eventType, egressInfo, room, participant } = webhookEvent;

		const roomOrRoomName = getRoomOrRoomName(webhookEvent);
		let isRoomCreatedByMe = false;

		if (roomOrRoomName) {
			isRoomCreatedByMe = roomOrRoomName ? await roomService.isRoomCreatedByMe(roomOrRoomName) : false;
		}

		// Skip webhook events that are not related to OpenVidu Demo App
		if (roomOrRoomName && !isRoomCreatedByMe) {
			logger.verbose(`Skipping webhook, event is not related to OpenVidu Demo App: ${eventType}`);
			return res.status(200).send();
		}

		logger.verbose(`Received webhook event: ${eventType}`);

		switch (eventType) {
			case 'egress_started':
			case 'egress_updated':
				await webhookService.handleEgressUpdated(egressInfo!);
				break;
			case 'egress_ended':
				await webhookService.handleEgressEnded(egressInfo!);
				break;
			case 'participant_joined':
				await webhookService.handleParticipantJoined(room!, participant!);
				break;
			default:
				break;
		}
	} catch (error) {
		logger.error(`Error handling webhook event: ${error}`);
	}

	return res.status(200).send();
};

function getRoomOrRoomName(webhookEvent: WebhookEvent) {
	const { room, egressInfo, ingressInfo } = webhookEvent;
	const roomName = room?.name ?? egressInfo?.roomName ?? ingressInfo?.roomName ?? '';

	// !KNOWN issue: room metadata is empty when track_publish and track_unpublish events are received
	// This not affect OpenVidu Demo App, but it is a limitation of the LiveKit server

	// Prefer webhook room object over roomName if available
	return room ?? roomName;
}
