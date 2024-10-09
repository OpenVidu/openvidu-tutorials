import { EgressInfo } from 'livekit-server-sdk';
import { RecordingInfo, RecordingOutputMode, RecordingStatus } from '../models/recording.model.js';
import { EgressStatus } from '@livekit/protocol';
import { DataTopic } from '../models/signal.model.js';

export class RecordingHelper {
	static toRecordingInfo(egressInfo: EgressInfo): RecordingInfo {
		const status = RecordingHelper.extractOpenViduStatus(egressInfo.status);
		const size = RecordingHelper.extractSize(egressInfo);
		const outputMode = RecordingHelper.extractOutputMode(egressInfo);
		const duration = RecordingHelper.extractDuration(egressInfo);
		const startedAt = RecordingHelper.extractCreatedAt(egressInfo);
		const endTimeInMilliseconds = RecordingHelper.extractEndedAt(egressInfo);
		const filename = RecordingHelper.extractFilename(egressInfo);
		const location = RecordingHelper.extractLocation(egressInfo);
		return {
			id: egressInfo.egressId,
			roomName: egressInfo.roomName,
			roomId: egressInfo.roomId,
			outputMode,
			status,
			filename,
			startedAt,
			endedAt: endTimeInMilliseconds,
			duration,
			size,
			location
		};
	}

	/**
	 * Checks if the egress is for recording.
	 * @param egress - The egress information.
	 * @returns A boolean indicating if the egress is for recording.
	 */
	static isRecordingEgress(egress: EgressInfo): boolean {
		const { streamResults = [], fileResults = [] } = egress;
		return fileResults.length > 0 && streamResults.length === 0;
	}

	static extractOpenViduStatus(status: EgressStatus | undefined): RecordingStatus {
		switch (status) {
			case EgressStatus.EGRESS_STARTING:
				return RecordingStatus.STARTING;
			case EgressStatus.EGRESS_ACTIVE:
				return RecordingStatus.STARTED;
			case EgressStatus.EGRESS_ENDING:
				return RecordingStatus.STOPPED;
			case EgressStatus.EGRESS_COMPLETE:
				return RecordingStatus.READY;
			case EgressStatus.EGRESS_FAILED:
			case EgressStatus.EGRESS_ABORTED:
			case EgressStatus.EGRESS_LIMIT_REACHED:
				return RecordingStatus.FAILED;
			default:
				return RecordingStatus.FAILED;
		}
	}

	static getDataTopicFromStatus(egressInfo: EgressInfo): DataTopic {
		const status = RecordingHelper.extractOpenViduStatus(egressInfo.status);

		switch (status) {
			case RecordingStatus.STARTING:
				return DataTopic.RECORDING_STARTING;
			case RecordingStatus.STARTED:
				return DataTopic.RECORDING_STARTED;
			case RecordingStatus.STOPPED:
			case RecordingStatus.READY:
				return DataTopic.RECORDING_STOPPED;
			case RecordingStatus.FAILED:
				return DataTopic.RECORDING_FAILED;
			default:
				return DataTopic.RECORDING_FAILED;
		}
	}

	/**
	 * Extracts the OpenVidu output mode based on the provided egress information.
	 * If the egress information contains roomComposite, it returns RecordingOutputMode.COMPOSED.
	 * Otherwise, it returns RecordingOutputMode.INDIVIDUAL.
	 *
	 * @param egressInfo - The egress information containing the roomComposite flag.
	 * @returns The extracted OpenVidu output mode.
	 */
	static extractOutputMode(egressInfo: EgressInfo): RecordingOutputMode {
		if (egressInfo.request.case === 'roomComposite') {
			return RecordingOutputMode.COMPOSED;
		} else {
			return RecordingOutputMode.INDIVIDUAL;
		}
	}

	static extractFilename(egressInfo: EgressInfo) {
		return egressInfo.fileResults?.[0]?.filename.split('/').pop();
	}

	static extractLocation(egressInfo: EgressInfo) {
		// TODO: Implement this method
		return egressInfo.fileResults?.[0]?.location;
	}

	static extractFileNameFromUrl(url: string | undefined): string | null {
		if (!url) {
			return null;
		}

		// Use a regular expression to capture the desired part of the URL
		const regex = /https:\/\/[^\/]+\/(.+)/;
		const match = url.match(regex);

		// Check if there is a match and extract the captured group
		if (match && match[1]) {
			return match[1];
		}

		throw new Error('The URL does not match the expected format.');
	}

	/**
	 * Extracts the duration from the given egress information.
	 * If the duration is not available, it returns 0.
	 * @param egressInfo The egress information containing the file results.
	 * @returns The duration in milliseconds.
	 */
	static extractDuration(egressInfo: EgressInfo): number {
		return this.toSeconds(Number(egressInfo.fileResults?.[0]?.duration ?? 0));
	}

	/**
	 * Extracts the endedAt value from the given EgressInfo object and converts it to milliseconds.
	 * If the endedAt value is not provided, it defaults to 0.
	 *
	 * @param egressInfo - The EgressInfo object containing the endedAt value.
	 * @returns The endedAt value converted to milliseconds.
	 */
	static extractEndedAt(egressInfo: EgressInfo): number {
		return this.toMilliseconds(Number(egressInfo.endedAt ?? 0));
	}

	/**
	 * Extracts the creation timestamp from the given EgressInfo object.
	 * If the startedAt property is not defined, it returns 0.
	 * @param egressInfo The EgressInfo object from which to extract the creation timestamp.
	 * @returns The creation timestamp in milliseconds.
	 */
	static extractCreatedAt(egressInfo: EgressInfo): number {
		const { startedAt, updatedAt } = egressInfo;
		const createdAt = startedAt && Number(startedAt) !== 0 ? startedAt : updatedAt ?? 0;
		return this.toMilliseconds(Number(createdAt));
	}

	/**
	 * Extracts the size from the given EgressInfo object.
	 * If the size is not available, it returns 0.
	 *
	 * @param egressInfo - The EgressInfo object to extract the size from.
	 * @returns The size extracted from the EgressInfo object, or 0 if not available.
	 */
	static extractSize(egressInfo: EgressInfo): number {
		return Number(egressInfo.fileResults?.[0]?.size ?? 0);
	}

	private static toSeconds(nanoseconds: number): number {
		const nanosecondsToSeconds = 1 / 1_000_000_000;
		return nanoseconds * nanosecondsToSeconds;
	}

	private static toMilliseconds(nanoseconds: number): number {
		const nanosecondsToMilliseconds = 1 / 1_000_000;
		return nanoseconds * nanosecondsToMilliseconds;
	}
}
