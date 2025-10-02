import {
	AccessToken,
	EgressClient,
	EgressInfo,
	EncodedFileOutput,
	ListEgressOptions,
	ParticipantInfo,
	RoomCompositeOptions,
	RoomServiceClient,
	StreamOutput,
	VideoGrant
} from 'livekit-server-sdk';
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL, LIVEKIT_URL_PRIVATE } from '../config.js';
import { LoggerService } from './logger.service.js';
import { errorLivekitIsNotAvailable, errorParticipantAlreadyExists, internalError } from '../models/error.model.js';

export class LiveKitService {
	protected static instance: LiveKitService;
	private egressClient: EgressClient;
	private roomClient: RoomServiceClient;
	private logger: LoggerService = LoggerService.getInstance();

	private constructor() {
		const livekitUrlHostname = LIVEKIT_URL_PRIVATE.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:');
		this.egressClient = new EgressClient(livekitUrlHostname, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
		this.roomClient = new RoomServiceClient(livekitUrlHostname, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
	}

	static getInstance() {
		if (!LiveKitService.instance) {
			LiveKitService.instance = new LiveKitService();
		}

		return LiveKitService.instance;
	}

	async generateToken(roomName: string, participantName: string): Promise<string> {
		try {
			if (await this.participantAlreadyExists(roomName, participantName)) {
				this.logger.error(`Participant ${participantName} already exists in room ${roomName}`);
				throw errorParticipantAlreadyExists(participantName, roomName);
			}
		} catch (error) {
			this.logger.error(`Error checking participant existence, ${JSON.stringify(error)}`);
			throw error;
		}

		this.logger.info(`Generating token for ${participantName} in room ${roomName}`);

		const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
			identity: participantName,
			name: participantName,
			metadata: JSON.stringify({
				livekitUrl: LIVEKIT_URL,
				roomAdmin: true
			})
		});
		const permissions: VideoGrant = {
			room: roomName,
			roomCreate: true,
			roomJoin: true,
			roomList: true,
			roomRecord: true,
			roomAdmin: true,
			ingressAdmin: true,
			canPublish: true,
			canSubscribe: true,
			canPublishData: true,
			canUpdateOwnMetadata: false,
			hidden: false,
			recorder: false,
			agent: false
		};
		at.addGrant(permissions);
		return at.toJwt();
	}

	private async participantAlreadyExists(roomName: string, participantName: string): Promise<boolean> {
		try {
			const participants: ParticipantInfo[] = await this.roomClient.listParticipants(roomName);
			return participants.some((participant) => participant.identity === participantName);
		} catch (error: any) {
			this.logger.error(error);

			if (error?.cause?.code === 'ECONNREFUSED') {
				throw errorLivekitIsNotAvailable();
			}

			return false;
		}
	}

	async startRoomComposite(
		roomName: string,
		output: EncodedFileOutput | StreamOutput,
		options: RoomCompositeOptions
	): Promise<EgressInfo> {
		try {
			return await this.egressClient.startRoomCompositeEgress(roomName, output, options);
		} catch (error: any) {
			this.logger.error('Error starting Room Composite Egress');
			throw internalError(`Error starting Room Composite Egress: ${JSON.stringify(error)}`);
		}
	}

	async stopEgress(egressId: string): Promise<EgressInfo> {
		try {
			this.logger.info(`Stopping ${egressId} egress`);
			return await this.egressClient.stopEgress(egressId);
		} catch (error: any) {
			this.logger.error(`Error stopping egress: JSON.stringify(error)`);
			throw internalError(`Error stopping egress: ${error}`);
		}
	}

	async getEgress(options: ListEgressOptions): Promise<EgressInfo[]> {
		try {
			return await this.egressClient.listEgress(options);
		} catch (error: any) {
			this.logger.error(`Error getting egress: ${JSON.stringify(error)}`);
			throw internalError(`Error getting egress: ${error}`);
		}
	}

	isEgressParticipant(participant: ParticipantInfo): boolean {
		return participant.identity.startsWith('EG_') && participant.permission?.recorder === true;
	}
}
