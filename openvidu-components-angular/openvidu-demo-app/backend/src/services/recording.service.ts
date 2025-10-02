import {
	EncodedFileOutput,
	EncodedFileType,
	ListEgressOptions,
	RoomCompositeOptions,
	SendDataOptions
} from 'livekit-server-sdk';
import { Readable } from 'stream';
import { LiveKitService } from './livekit.service.js';
import {
	OpenViduDemoAppError,
	errorRecordingAlreadyStarted,
	errorRecordingNotFound,
	errorRecordingNotStopped,
	internalError
} from '../models/error.model.js';
import { StorageServiceFactory } from './storage.service.js';
import { DataTopic } from '../models/signal.model.js';
import { LoggerService } from './logger.service.js';
import { RecordingInfo, RecordingStatus } from '../models/recording.model.js';
import { RecordingHelper } from '../helpers/recording.helper.js';
import { DEMO_APP_S3_BUCKET, DEMO_APP_S3_PARENT_DIRECTORY, DEMO_APP_S3_RECORDING_DIRECTORY } from '../config.js';
import { RoomService } from './room.service.js';

export class RecordingService {
	protected static instance: RecordingService;
	private livekitService = LiveKitService.getInstance();
	private roomService = RoomService.getInstance();
	private storageService = StorageServiceFactory.getInstance();
	private logger = LoggerService.getInstance();

	static getInstance() {
		if (!RecordingService.instance) {
			RecordingService.instance = new RecordingService();
		}

		return RecordingService.instance;
	}

	async startRecording(roomName: string): Promise<RecordingInfo> {
		try {
			const egressOptions: ListEgressOptions = {
				roomName,
				active: true
			};

			const [activeEgressResult, roomDataResult] = await Promise.allSettled([
				this.livekitService.getEgress(egressOptions),
				this.roomService.getRoom(roomName)
			]);

			// Get the results of the promises
			const activeEgress = activeEgressResult.status === 'fulfilled' ? activeEgressResult.value : null;
			const roomData = roomDataResult.status === 'fulfilled' ? roomDataResult.value : null;

			// If there is an active egress, it means that the recording is already started
			if (!activeEgress || activeEgressResult.status === 'rejected') {
				throw errorRecordingAlreadyStarted(roomName);
			}

			const recordingId = `${roomName}-${roomData?.sid || Date.now()}`;
			const options = this.generateCompositeOptionsFromRequest();
			const output = this.generateFileOutputFromRequest(recordingId);
			const egressInfo = await this.livekitService.startRoomComposite(roomName, output, options);
			return RecordingHelper.toRecordingInfo(egressInfo);
		} catch (error) {
			this.logger.error(`Error starting recording in room ${roomName}: ${error}`);
			let payload = { error: error, statusCode: 500 };
			const options: SendDataOptions = {
				destinationSids: [],
				topic: DataTopic.RECORDING_FAILED
			};

			if (error instanceof OpenViduDemoAppError) {
				payload = { error: error.message, statusCode: error.statusCode };
			}

			this.roomService.sendSignal(roomName, payload, options);

			throw error;
		}
	}

	async stopRecording(egressId: string): Promise<RecordingInfo> {
		try {
			const options: ListEgressOptions = {
				egressId,
				active: true
			};
			const egressArray = await this.livekitService.getEgress(options);

			if (egressArray.length === 0) {
				throw errorRecordingNotFound(egressId);
			}

			const egressInfo = await this.livekitService.stopEgress(egressId);
			return RecordingHelper.toRecordingInfo(egressInfo);
		} catch (error) {
			this.logger.error(`Error stopping recording ${egressId}: ${error}`);
			throw error;
		}
	}

	async deleteRecording(egressId: string, isRequestedByAdmin: boolean): Promise<RecordingInfo> {
		try {
			// Get the recording object from the S3 bucket
			const directory = `${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}/.metadata`;
			const metadataObject = await this.storageService.listObjects(directory, `.*${egressId}.*.json`);

			if (!metadataObject.Contents || metadataObject.Contents.length === 0) {
				throw errorRecordingNotFound(egressId);
			}

			const metadataPath = metadataObject.Contents[0].Key;
			const recordingInfo = (await this.storageService.getObjectAsJson(metadataPath!)) as RecordingInfo;

			if (recordingInfo.status === RecordingStatus.STARTED) {
				throw errorRecordingNotStopped(egressId);
			}

			const recordingFilename = RecordingHelper.extractFilename(recordingInfo);

			if (!recordingFilename) throw internalError(`Error extracting path from recording ${egressId}`);

			const recordingPath = `${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}/${recordingFilename}`;

			await Promise.all([this.storageService.deleteObject(metadataPath!), this.storageService.deleteObject(recordingPath)]);

			this.logger.info(`Recording ${egressId} deleted successfully`);

			if (!isRequestedByAdmin) {
				const signalOptions: SendDataOptions = {
					destinationSids: [],
					topic: DataTopic.RECORDING_DELETED
				};
				await this.roomService.sendSignal(recordingInfo.roomName, recordingInfo, signalOptions);
			}

			return recordingInfo;
		} catch (error) {
			this.logger.error(`Error deleting recording ${egressId}: ${error}`);
			throw error;
		}
	}

	/**
	 * Retrieves the list of all recordings.
	 * @returns A promise that resolves to an array of RecordingInfo objects.
	 */
	async getAllRecordings(): Promise<{ recordingInfo: RecordingInfo[]; continuationToken?: string }> {
		try {
			const directory = `${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}/.metadata`;
			const allEgress = await this.storageService.listObjects(directory, '.json');
			const promises: Promise<RecordingInfo>[] = [];

			allEgress.Contents?.forEach((item) => {
				if (item?.Key?.includes('.json')) {
					promises.push(this.storageService.getObjectAsJson(item.Key) as Promise<RecordingInfo>);
				}
			});

			return { recordingInfo: await Promise.all(promises), continuationToken: undefined };
		} catch (error) {
			this.logger.error(`Error getting recordings: ${error}`);
			throw error;
		}
	}

	/**
	 * Retrieves all recordings for a given room.
	 *
	 * @param roomName - The name of the room.
	 * @param roomId - The ID of the room.
	 * @returns A promise that resolves to an array of RecordingInfo objects.
	 * @throws If there is an error retrieving the recordings.
	 */
	async getAllRecordingsByRoom(roomName: string, roomId: string): Promise<RecordingInfo[]> {
		try {
			// Get all recordings that match the room name and room ID from the S3 bucket
			const roomNameSanitized = this.sanitizeRegExp(roomName);
			const roomIdSanitized = this.sanitizeRegExp(roomId);
			// Match the room name and room ID in any order
			const regexPattern = `${roomNameSanitized}.*${roomIdSanitized}|${roomIdSanitized}.*${roomNameSanitized}\\.json`;
			const directory = `${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}/.metadata`;
			const metadatagObject = await this.storageService.listObjects(directory, regexPattern);

			if (!metadatagObject.Contents || metadatagObject.Contents.length === 0) {
				this.logger.verbose(`No recordings found for room ${roomName}. Returning an empty array.`);
				return [];
			}

			const promises: Promise<RecordingInfo>[] = [];
			metadatagObject.Contents?.forEach((item) => {
				promises.push(this.storageService.getObjectAsJson(item.Key!) as Promise<RecordingInfo>);
			});

			return Promise.all(promises);
		} catch (error) {
			this.logger.error(`Error getting recordings: ${error}`);
			throw error;
		}
	}

	private async getRecording(egressId: string): Promise<RecordingInfo> {
		const egressIdSanitized = this.sanitizeRegExp(egressId);
		const regexPattern = `.*${egressIdSanitized}.*\\.json`;
		const directory = `${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}/.metadata`;
		const metadataObject = await this.storageService.listObjects(directory, regexPattern);

		if (!metadataObject.Contents || metadataObject.Contents.length === 0) {
			throw errorRecordingNotFound(egressId);
		}

		const recording = (await this.storageService.getObjectAsJson(metadataObject.Contents[0].Key!)) as RecordingInfo;
		return recording;
		// return RecordingHelper.toRecordingInfo(recording);
	}

	async getRecordingAsStream(
		recordingId: string,
		range?: string
	): Promise<{ fileSize: number | undefined; fileStream: Readable; start?: number; end?: number }> {
		const RECORDING_FILE_PORTION_SIZE = 5 * 1024 * 1024; // 5MB
		const recordingInfo: RecordingInfo = await this.getRecording(recordingId);
		const recordingFilename = RecordingHelper.extractFilename(recordingInfo);

		if (!recordingFilename) throw new Error(`Error extracting path from recording ${recordingId}`);

		const recordingPath = `${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}/${recordingFilename}`;
		const data = await this.storageService.getHeaderObject(recordingPath);
		const fileSize = data.ContentLength;

		if (range && fileSize) {
			// Parse the range header
			const parts = range.replace(/bytes=/, '').split('-');
			const start = parseInt(parts[0], 10);
			const endRange = parts[1] ? parseInt(parts[1], 10) : start + RECORDING_FILE_PORTION_SIZE;
			const end = Math.min(endRange, fileSize - 1);
			const fileStream = await this.storageService.getObjectAsStream(recordingPath, DEMO_APP_S3_BUCKET, {
				start,
				end
			});
			return { fileSize, fileStream, start, end };
		} else {
			const fileStream = await this.storageService.getObjectAsStream(recordingPath);
			return { fileSize, fileStream };
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

	/**
	 * Generates a file output object based on the provided room name and file name.
	 * @param recordingId - The recording id.
	 * @param fileName - The name of the file (default is 'recording').
	 * @returns The generated file output object.
	 */
	private generateFileOutputFromRequest(recordingId: string): EncodedFileOutput {
		// Added unique identifier to the file path for avoiding overwriting
		const filepath = `${DEMO_APP_S3_PARENT_DIRECTORY}/${DEMO_APP_S3_RECORDING_DIRECTORY}/${recordingId}/${recordingId}-${Date.now()}`;

		return new EncodedFileOutput({
			fileType: EncodedFileType.DEFAULT_FILETYPE,
			filepath,
			disableManifest: true
		});
	}

	private sanitizeRegExp(str: string) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
