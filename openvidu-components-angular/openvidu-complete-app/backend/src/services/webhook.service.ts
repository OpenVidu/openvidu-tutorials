import { EgressInfo, ParticipantInfo, Room, SendDataOptions, WebhookEvent, WebhookReceiver } from 'livekit-server-sdk';
import { BroadcastingHelper } from '../helpers/broadcasting.helper.js';
import { RecordingHelper } from '../helpers/recording.helper.js';
import { DataTopic } from '../models/signal.model.js';
import { LiveKitService } from './livekit.service.js';
import { BroadcastingInfo, BroadcastingStatus } from '../models/broadcasting.model.js';
import { RecordingInfo, RecordingStatus } from '../models/recording.model.js';
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from '../config.js';
import { LoggerService } from './logger.service.js';
import { RoomService } from './room.service.js';
import { S3Service } from './s3.service.js';
import { RoomStatusData } from '../models/room.model.js';
import { BroadcastingService } from './broadcasting.service.js';
import { RecordingService } from './recording.service.js';

export class WebhookService {
	private static instance: WebhookService;
	private livekitService = LiveKitService.getInstance();
	private s3Service = S3Service.getInstance();
	private roomService = RoomService.getInstance();
	private recordingService = RecordingService.getInstance();
	private broadcastingService = BroadcastingService.getInstance();
	private logger: LoggerService = LoggerService.getInstance();

	private webhookReceiver: WebhookReceiver;

	private constructor() {
		this.webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
	}

	static getInstance(): WebhookService {
		if (!WebhookService.instance) {
			WebhookService.instance = new WebhookService();
		}

		return WebhookService.instance;
	}

	/**
	 * Retrieves a WebhookEvent from the provided request body and authentication token.
	 * @param body - The request body containing the webhook data.
	 * @param auth - The authentication token for verifying the webhook request.
	 * @returns The WebhookEvent extracted from the request body.
	 */
	async getEventFromWebhook(body: string, auth?: string): Promise<WebhookEvent> {
		return await this.webhookReceiver.receive(body, auth);
	}

	async handleEgressUpdated(egressInfo: EgressInfo) {
		try {
			const isRecording: boolean = RecordingHelper.isRecordingEgress(egressInfo);
			const isBroadcasting: boolean = BroadcastingHelper.isBroadcastingEgress(egressInfo);

			if (!isRecording && !isBroadcasting) return;

			const { roomName } = egressInfo;

			let topic: DataTopic;
			let payload: RecordingInfo | BroadcastingInfo | undefined = undefined;

			if (isRecording) {
				this.logger.info(`Recording egress '${egressInfo.egressId}' updated: ${egressInfo.status}`);
				topic = RecordingHelper.getDataTopicFromStatus(egressInfo);
				payload = RecordingHelper.toRecordingInfo(egressInfo);

				// Add recording metadata
				const s3Directory = payload.filename?.split('.')[0];
				const path = `.metadata/${s3Directory}/${s3Directory}_${payload.id}_${payload.roomId}.json`;
				await Promise.all([
					this.s3Service.uploadObject(path, payload),
					this.roomService.sendSignal(roomName, payload, { topic })
				]);

				// If the recording has stopped, we replace the topic with 'recording_stopping' to indicate that the recording is stopping
				// the 'handleEgressEnded' method will handle the 'recording_stopped' event
				if (topic === DataTopic.RECORDING_STOPPED) {
					topic = DataTopic.RECORDING_STOPPING;
				}
			} else {
				this.logger.info(`Broadcasting egress '${egressInfo.egressId}' updated: ${egressInfo.status}`);
				topic = BroadcastingHelper.getDataTopicFromStatus(egressInfo);
				payload = BroadcastingHelper.toBroadcastingInfo(egressInfo);

				// If the broadcasting has stopped, we replace the topic with 'recording_stopping' to indicate that the recording is stopping
				// the 'handleEgressEnded' method will handle the 'broadcasting_stopped' event
				if (topic === DataTopic.BROADCASTING_STOPPED) {
					topic = DataTopic.RECORDING_STOPPING;
				}

				await this.roomService.sendSignal(roomName, payload, { topic });
			}
		} catch (error) {
			this.logger.warn(`Error sending data on egress updated: ${error}`);
		}
	}

	/**
	 * Handles the 'egress_ended' event by processing recording-related information, updating the recordings list,
	 * and sending the appropriate data payload to indicate the end of a recording or broadcasting session.
	 *
	 * @param egressInfo - Information related to the egress event.
	 */
	async handleEgressEnded(egressInfo: EgressInfo) {
		try {
			const isRecording: boolean = RecordingHelper.isRecordingEgress(egressInfo);
			const isBroadcasting: boolean = BroadcastingHelper.isBroadcastingEgress(egressInfo);

			if (!isRecording && !isBroadcasting) return;

			const { roomName } = egressInfo;

			let topic: DataTopic;
			let payload: RecordingInfo | BroadcastingInfo | undefined = undefined;

			if (isRecording) {
				topic = DataTopic.RECORDING_STOPPED;
				payload = RecordingHelper.toRecordingInfo(egressInfo);

				// Update recording metadata
				const s3Directory = payload.filename?.split('.')[0];
				const path = `.metadata/${s3Directory}/${s3Directory}_${payload.id}_${payload.roomId}.json`;
				await Promise.all([
					this.s3Service.uploadObject(path, payload),
					this.roomService.sendSignal(roomName, payload, { topic })
				]);
			} else {
				topic = DataTopic.BROADCASTING_STOPPED;
				payload = BroadcastingHelper.toBroadcastingInfo(egressInfo);
				await this.roomService.sendSignal(roomName, payload, { topic });
			}
		} catch (error) {
			this.logger.warn(`Error sending data on egress ended: ${error}`);
		}
	}

	/**
	 *
	 * Handles the 'participant_joined' event by gathering relevant room and participant information,
	 * checking room status, and sending a data payload with room status information to the newly joined participant.
	 * @param room - Information about the room where the participant joined.
	 * @param participant - Information about the newly joined participant.
	 */
	async handleParticipantJoined(room: Room, participant: ParticipantInfo) {
		try {
			// Do not send status signal to egress participants
			if (this.livekitService.isEgressParticipant(participant)) {
				return;
			}

			await this.sendStatusSignal(room.name, room.sid, participant.sid);
		} catch (error) {
			this.logger.error(`Error sending data on participant joined: ${error}`);
		}
	}

	private async sendStatusSignal(roomName: string, roomId: string, participantSid: string) {
		// Get broadcsting and recording list
		const [broadcastingList, recordingInfo] = await Promise.all([
			this.broadcastingService.getAllBroadcastingsByRoom(roomName, roomId),
			this.recordingService.getAllRecordingsByRoom(roomName, roomId)
		]);

		// Check if recording or broadcasting is started in the room
		const isRecordingStarted = recordingInfo.some((rec) => rec.status === RecordingStatus.STARTED);
		const isBroadcastingStarted = broadcastingList.some((bc) => bc.status === BroadcastingStatus.STARTED);

		// Construct the payload to send to the participant
		const payload: RoomStatusData = {
			isRecordingStarted,
			isBroadcastingStarted,
			recordingList: recordingInfo,
			broadcastingId: isBroadcastingStarted ? broadcastingList[0].id : ''
		};
		const signalOptions: SendDataOptions = {
			topic: DataTopic.ROOM_STATUS,
			destinationSids: participantSid ? [participantSid] : []
		};
		await this.roomService.sendSignal(roomName, payload, signalOptions);
	}
}
