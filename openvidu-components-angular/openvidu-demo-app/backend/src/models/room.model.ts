import { RecordingInfo } from './recording.model.js';

export interface RoomStatusData {
	isRecordingStarted: boolean;
	isBroadcastingStarted: boolean;
	recordingList: RecordingInfo[];
	broadcastingId: string;
}
