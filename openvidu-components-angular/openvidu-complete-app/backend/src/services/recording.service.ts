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
	OpenViduError,
	errorRecordingAlreadyStarted,
	errorRecordingNotFound,
	errorRecordingNotStopped,
	internalError
} from '../models/error.model.js';
import { S3Service } from './s3.service.js';
import { DataTopic } from '../models/signal.model.js';
import { LoggerService } from './logger.service.js';
import { RecordingInfo, RecordingStatus } from '../models/recording.model.js';
import { RecordingHelper } from '../helpers/recording.helper.js';
import { S3_BUCKET } from '../config.js';
import { RoomService } from './room.service.js';

export class RecordingService {
	protected static instance: RecordingService;
	private livekitService = LiveKitService.getInstance();
	private roomService = RoomService.getInstance();
	private s3Service = S3Service.getInstance();
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

			const activeEgress = await this.livekitService.getEgress(egressOptions);

			if (activeEgress.length > 0) {
				throw errorRecordingAlreadyStarted(roomName);
			}

			const recordingId = `${roomName}-${Date.now()}`;
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

			if (error instanceof OpenViduError) {
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
			const metadataObject = await this.s3Service.listObjects('.metadata', `.*${egressId}.*.json`);

			if (!metadataObject.Contents || metadataObject.Contents.length === 0) {
				throw errorRecordingNotFound(egressId);
			}

			const metadataPath = metadataObject.Contents[0].Key;
			const recordingInfo = (await this.s3Service.getObjectAsJson(metadataPath!)) as RecordingInfo;

			if (recordingInfo.status === RecordingStatus.STARTED) {
				throw errorRecordingNotStopped(egressId);
			}

			const recordingPath = RecordingHelper.extractFileNameFromUrl(recordingInfo.location);

			if (!recordingPath) throw internalError(`Error extracting path from recording ${egressId}`);

			this.logger.info(`Deleting recording from S3 ${recordingPath}`);

			await Promise.all([this.s3Service.deleteObject(metadataPath!), this.s3Service.deleteObject(recordingPath)]);

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
	 * Retrieves the list of recordings.
	 * @returns A promise that resolves to an array of RecordingInfo objects.
	 */
	async getAllRecordings(
		continuationToken?: string
	): Promise<{ recordingInfo: RecordingInfo[]; continuationToken?: string }> {
		try {
			const allEgress = await this.s3Service.listObjects('.metadata', '.json', 'openvidu', 20, continuationToken);
			const promises: Promise<RecordingInfo>[] = [];

			allEgress.Contents?.forEach((item) => {
				if (item?.Key?.includes('.json')) {
					promises.push(this.s3Service.getObjectAsJson(item.Key) as Promise<RecordingInfo>);
				}
			});

			return { recordingInfo: await Promise.all(promises), continuationToken: allEgress.NextContinuationToken };
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
			const regexPattern = `${roomNameSanitized}.*${roomIdSanitized}\\.json`;
			const metadatagObject = await this.s3Service.listObjects('.metadata', regexPattern);

			if (!metadatagObject.Contents || metadatagObject.Contents.length === 0) {
				return [];
			}

			const promises: Promise<RecordingInfo>[] = [];
			metadatagObject.Contents?.forEach((item) => {
				promises.push(this.s3Service.getObjectAsJson(item.Key!) as Promise<RecordingInfo>);
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
		const metadataObject = await this.s3Service.listObjects('.metadata', regexPattern);

		if (!metadataObject.Contents || metadataObject.Contents.length === 0) {
			throw errorRecordingNotFound(egressId);
		}

		const recording = (await this.s3Service.getObjectAsJson(metadataObject.Contents[0].Key!)) as RecordingInfo;
		return recording;
		// return RecordingHelper.toRecordingInfo(recording);
	}

	async getRecordingAsStream(
		recordingId: string,
		range?: string
	): Promise<{ fileSize: number | undefined; fileStream: Readable; start?: number; end?: number }> {
		const RECORDING_FILE_PORTION_SIZE = 5 * 1024 * 1024; // 5MB
		const egressInfo = await this.getRecording(recordingId);
		const recordingPath = RecordingHelper.extractFileNameFromUrl(egressInfo.location);

		if (!recordingPath) throw new Error(`Error extracting path from recording ${recordingId}`);

		const data = await this.s3Service.getHeaderObject(recordingPath);
		const fileSize = data.ContentLength;

		if (range && fileSize) {
			// Parse the range header
			const parts = range.replace(/bytes=/, '').split('-');
			const start = parseInt(parts[0], 10);
			const endRange = parts[1] ? parseInt(parts[1], 10) : start + RECORDING_FILE_PORTION_SIZE;
			const end = Math.min(endRange, fileSize - 1);
			const fileStream = await this.s3Service.getObjectAsStream(recordingPath, S3_BUCKET, {
				start,
				end
			});
			return { fileSize, fileStream, start, end };
		} else {
			const fileStream = await this.s3Service.getObjectAsStream(recordingPath);
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
	private generateFileOutputFromRequest(recordingId: string, filePathOrFileName?: string): EncodedFileOutput {
		let filepath: string;

		if (!filePathOrFileName) filePathOrFileName = recordingId;

		const isFilePath = filePathOrFileName.includes('/');

		if (isFilePath) {
			filepath = filePathOrFileName;
		} else {
			filepath = `${recordingId}/${filePathOrFileName}`;
		}

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
