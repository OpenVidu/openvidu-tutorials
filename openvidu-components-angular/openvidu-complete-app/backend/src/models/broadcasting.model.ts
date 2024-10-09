export enum BroadcastingStatus {
	STARTING = 'STARTING',
	STARTED = 'STARTED',
	STOPPING = 'STOPPING',
	STOPPED = 'STOPPED',
	FAILED = 'FAILED'
}

/**
 * Interface representing a broadcasting
 */
export interface BroadcastingInfo {
	id: string;
	status: BroadcastingStatus;
	startedAt?: number;
	endedAt?: number;
	duration?: number;
	platform?: string;
}
