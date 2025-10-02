import {
	ListEgressOptions,
	RoomCompositeOptions,
	SendDataOptions,
	StreamOutput,
	StreamProtocol
} from 'livekit-server-sdk';
import { LiveKitService } from './livekit.service.js';
import { LoggerService } from './logger.service.js';
import { BroadcastingInfo } from '../models/broadcasting.model.js';
import { BroadcastingHelper } from '../helpers/broadcasting.helper.js';
import { DataTopic } from '../models/signal.model.js';
import { RoomService } from './room.service.js';

export class BroadcastingService {
	protected static instance: BroadcastingService;
	private livekitService = LiveKitService.getInstance();
	private roomService = RoomService.getInstance();
	private logger = LoggerService.getInstance();

	static getInstance() {
		if (!BroadcastingService.instance) {
			BroadcastingService.instance = new BroadcastingService();
		}

		return BroadcastingService.instance;
	}

	async startBroadcasting(roomName: string, broadcastUrl: string): Promise<BroadcastingInfo> {
		try {
			const options = this.generateCompositeOptionsFromRequest();
			const output = this.generateFileOutputFromRequest(broadcastUrl);
			const egressInfo = await this.livekitService.startRoomComposite(roomName, output, options);
			return BroadcastingHelper.toBroadcastingInfo(egressInfo);
		} catch (error) {
			this.logger.error(`Error starting recording in room ${roomName}: ${error}`);
			const options: SendDataOptions = {
				destinationSids: [],
				topic: DataTopic.BROADCASTING_FAILED
			};
			this.roomService.sendSignal(roomName, {}, options);
			throw error;
		}
	}

	async stopBroadcasting(egressId: string): Promise<BroadcastingInfo> {
		try {
			const egressInfo = await this.livekitService.stopEgress(egressId);
			return BroadcastingHelper.toBroadcastingInfo(egressInfo);
		} catch (error) {
			this.logger.error(`Error stopping broadcasting ${egressId}: ${error}`);
			throw error;
		}
	}

	private generateCompositeOptionsFromRequest(layout = 'speaker'): RoomCompositeOptions {
		return {
			layout: layout
			// customBaseUrl: customLayout,
			// audioOnly: false,
			// videoOnly: false
		};
	}

	private generateFileOutputFromRequest(url: string): StreamOutput {
		return new StreamOutput({
			protocol: StreamProtocol.RTMP,
			urls: [url]
		});
	}

	async getAllBroadcastingsByRoom(roomName: string, roomId: string): Promise<BroadcastingInfo[]> {
		try {
			const options: ListEgressOptions = {
				roomName
			};
			const allEgress = await this.livekitService.getEgress(options);
			const broadcastingInfo: BroadcastingInfo[] = allEgress
				.filter((egress) => BroadcastingHelper.isBroadcastingEgress(egress) && egress.roomId === roomId)
				.map(BroadcastingHelper.toBroadcastingInfo);

			return broadcastingInfo;
		} catch (error) {
			this.logger.error(`Error getting recordings: ${error}`);
			throw error;
		}
	}
}
