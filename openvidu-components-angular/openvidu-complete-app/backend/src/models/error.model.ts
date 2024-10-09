type StatusError = 400 | 404 | 406 | 409 | 422 | 500 | 503;
export class OpenViduError extends Error {
	name: string;
	statusCode: StatusError;
	constructor(error: string, message: string, statusCode: StatusError) {
		super(message);
		this.name = error;
		this.statusCode = statusCode;
	}
}

// General errors

export const errorLivekitIsNotAvailable = (): OpenViduError => {
	return new OpenViduError('LiveKit Error', 'LiveKit is not available', 503);
};

export const errorS3NotAvailable = (error: any): OpenViduError => {
	return new OpenViduError('S3 Error', `S3 is not available ${error}`, 503);
}

export const internalError = (error: any): OpenViduError => {
	return new OpenViduError('Unexpected error', `Something went wrong ${error}`, 500);
};

export const errorRequest = (error: string): OpenViduError => {
	return new OpenViduError('Wrong request', `Problem with some body parameter. ${error}`, 400);
};

export const errorUnprocessableParams = (error: string): OpenViduError => {
	return new OpenViduError('Wrong request', `Some parameters are not valid. ${error}`, 422);
};

// Recording errors

export const errorRecordingNotFound = (recordingId: string): OpenViduError => {
	return new OpenViduError('Recording Error', `Recording ${recordingId} not found`, 404);
};

export const errorRecordingNotStopped = (recordingId: string): OpenViduError => {
	return new OpenViduError('Recording Error', `Recording ${recordingId} is not stopped yet`, 409);
};

export const errorRecordingNotReady = (recordingId: string): OpenViduError => {
	return new OpenViduError('Recording Error', `Recording ${recordingId} is not ready yet`, 409);
};

export const errorRecordingAlreadyStopped = (recordingId: string): OpenViduError => {
	return new OpenViduError('Recording Error', `Recording ${recordingId} is already stopped`, 409);
};

export const errorRecordingAlreadyStarted = (roomName: string): OpenViduError => {
	return new OpenViduError('Recording Error', `The room '${roomName}' is already being recorded`, 409);
};


// Broadcasting errors

export const errorSessionWithoutParticipants = (roomName: string): OpenViduError => {
	return new OpenViduError('Broadcasting Error', `The room '${roomName}' does not have participants`, 406);
};

export const errorBroadcastingAlreadyStarted = (roomName: string): OpenViduError => {
	return new OpenViduError('Broadcasting Error', `The room '${roomName}' is already being broadcasted`, 409);
};

export const errorBroadcastingNotStarted = (roomName: string): OpenViduError => {
	return new OpenViduError('Broadcasting Error', `The room '${roomName}' is not being broadcasted`, 409);
};

// Room errors
export const errorRoomNotFound = (roomName: string): OpenViduError => {
	return new OpenViduError('Room Error', `The room '${roomName}' does not exist`, 404);
};

export const errorParticipantAlreadyExists = (participantName: string, roomName: string): OpenViduError => {
	return new OpenViduError(
		'Room Error',
		`'${participantName}' already exists in room in ${roomName}`,
		409
	);
};
