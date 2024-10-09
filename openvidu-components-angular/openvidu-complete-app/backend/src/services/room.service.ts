import { CreateOptions, DataPacket_Kind, Room, RoomServiceClient, SendDataOptions } from 'livekit-server-sdk';
import { LoggerService } from './logger.service.js';
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL_PRIVATE, NAME_ID } from '../config.js';
import { OpenViduError, errorRoomNotFound, internalError } from '../models/error.model.js';

export class RoomService {
	private static instance: RoomService;
	private roomClient: RoomServiceClient;
	private logger = LoggerService.getInstance();

	private constructor() {
		const livekitUrlHostname = LIVEKIT_URL_PRIVATE.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:');
		this.roomClient = new RoomServiceClient(livekitUrlHostname, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
	}

	static getInstance() {
		if (!RoomService.instance) {
			RoomService.instance = new RoomService();
		}

		return RoomService.instance;
	}

	/**
	 * Creates a new room with the specified name.
	 * @param roomName - The name of the room to create.
	 * @returns A Promise that resolves to the created Room object.
	 */
	createRoom(roomName: string): Promise<Room> {
		const roomOptions: CreateOptions = {
			name: roomName,
			metadata: JSON.stringify({
				createdBy: NAME_ID
			})
			// emptyTimeout: 315360000,
			// departureTimeout: 1 // Close the room almost immediately after the last participant leaves for emulating the OV2 behavior
		};

		return this.roomClient.createRoom(roomOptions);
	}

	/**
	 * Retrieves a room by its name.
	 * @param roomName - The name of the room to retrieve.
	 * @returns A Promise that resolves to the retrieved Room object.
	 * @throws If there was an error retrieving the room or if the room was not found.
	 */
	async getRoom(roomName: string): Promise<Room> {
		let rooms: Room[] = [];

		try {
			rooms = await this.roomClient.listRooms([roomName]);
		} catch (error) {
			this.logger.error(`Error getting room ${error}`);
			throw internalError(`Error getting room: ${error}`);
		}

		if (rooms.length === 0) {
			throw errorRoomNotFound(roomName);
		}

		return rooms[0];
	}

	/**
	 * Checks if a room was created by the current user.
	 *
	 * @param roomOrRoomName - The room object or the room name.
	 * @returns A promise that resolves to a boolean indicating whether the room was created by the current user.
	 */
	async isRoomCreatedByMe(roomOrRoomName: Room | string): Promise<boolean> {
		try {
			let room: Room;

			if (typeof roomOrRoomName === 'string') {
				room = await this.getRoom(roomOrRoomName);
			} else {
				room = roomOrRoomName;

				// !KNOWN issue: room metadata is empty when track_publish and track_unpublish events are received
				if (!room.metadata) {
					room = await this.getRoom(room.name);
				}
			}

			const metadata = room.metadata ? JSON.parse(room.metadata) : null;
			return metadata?.createdBy === NAME_ID;
		} catch (error) {
			console.warn('Error getting Room while checking webhook. Room may no longer exist. Ignoring');
			return false;
		}
	}

	/**
	 * Sends a signal to the specified room.
	 *
	 * @param roomName - The name of the room.
	 * @param rawData - The raw data to be sent as a signal.
	 * @param options - The options for sending the signal.
	 * @returns A Promise that resolves to the updated Room object after sending the signal.
	 * @throws {OpenViduError} If there is an error sending the signal.
	 * @throws {Error} If the room is not found or if there is no RoomServiceClient available.
	 */
	async sendSignal(roomName: string, rawData: any, options: SendDataOptions): Promise<Room> {
		try {
			if (this.roomClient) {
				const room = await this.getRoom(roomName);

				if (!room) throw errorRoomNotFound(roomName);

				const data: Uint8Array = new TextEncoder().encode(JSON.stringify(rawData));
				this.logger.verbose(
					`Sending signal "${options.topic}" to ${
						options.destinationIdentities
							? `participant(s) ${options.destinationIdentities}`
							: 'all participants'
					} in room "${roomName}".`
				);
				await this.roomClient.sendData(roomName, data, DataPacket_Kind.RELIABLE, options);
				return room;
			} else {
				throw internalError(`No RoomServiceClient available`);
			}
		} catch (error) {
			if (error instanceof OpenViduError) {
				throw error;
			}

			throw internalError(`Error sending signal: ${error}`);
		}
	}
}
