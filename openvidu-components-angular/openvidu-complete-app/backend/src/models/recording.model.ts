export enum RecordingStatus {
	STARTING = 'STARTING',
	STARTED = 'STARTED',
	STOPPING = 'STOPPING',
	STOPPED = 'STOPPED',
	FAILED = 'FAILED',
	READY = 'READY'
}

export enum RecordingOutputMode {
	COMPOSED = 'COMPOSED',
	INDIVIDUAL = 'INDIVIDUAL'
}

/**
 * Interface representing a recording
 */
export interface RecordingInfo {
	id: string;
	roomName: string;
	roomId: string;
	outputMode: RecordingOutputMode;
	status: RecordingStatus;
	filename?: string;
	startedAt?: number;
	endedAt?: number;
	duration?: number;
	size?: number;
	location?: string;
}
