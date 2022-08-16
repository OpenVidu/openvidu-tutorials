import { Connection, ConnectionProperties, OpenVidu, OpenViduRole, Recording, Session, SessionProperties } from 'openvidu-node-client';
import { OPENVIDU_URL, OPENVIDU_SECRET } from '../config';

export class OpenViduService {
	RECORDING_TOKEN_NAME = 'ovCallRecordingToken';
	ADMIN_TOKEN_NAME = 'ovCallAdminToken';
	recordingMap: Map<string, { token: string; recordingId: string }> = new Map<string, { token: string; recordingId: string }>();
	adminTokens: string[] = [];
	protected static instance: OpenViduService;
	private openvidu: OpenVidu;

	private constructor() {
		this.openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
	}

	static getInstance() {
		if (!OpenViduService.instance) {
			OpenViduService.instance = new OpenViduService();
		}
		return OpenViduService.instance;
	}

	getBasicAuth(): string {
		return this.openvidu.basicAuth;
	}

	getDateFromCookie(cookies: any): number {
		try {
			const cookieToken = cookies[this.RECORDING_TOKEN_NAME];
			if (!!cookieToken) {
				const cookieTokenUrl = new URL(cookieToken);
				const date = cookieTokenUrl?.searchParams.get('createdAt');
				return Number(date);
			} else {
				return Date.now();
			}
		} catch (error) {
			return Date.now();
		}
	}

	getSessionIdFromCookie(cookies: any): string {
		try {
			const cookieTokenUrl = new URL(cookies[this.RECORDING_TOKEN_NAME]);
			return cookieTokenUrl?.searchParams.get('sessionId');
		} catch (error) {
			console.log('Recording cookie not found');
			console.error(error);
			return '';
		}
	}

	isValidToken(sessionId: string, cookies: any): boolean {
		try {
			const storedTokenUrl = new URL(this.recordingMap.get(sessionId)?.token);
			const cookieTokenUrl = new URL(cookies[this.RECORDING_TOKEN_NAME]);
			if (!!cookieTokenUrl && !!storedTokenUrl) {
				const cookieSessionId = cookieTokenUrl.searchParams.get('sessionId');
				const cookieToken = cookieTokenUrl.searchParams.get(this.RECORDING_TOKEN_NAME);
				const cookieDate = cookieTokenUrl.searchParams.get('createdAt');

				const storedToken = storedTokenUrl.searchParams.get(this.RECORDING_TOKEN_NAME);
				const storedDate = storedTokenUrl.searchParams.get('createdAt');

				return sessionId === cookieSessionId && cookieToken === storedToken && cookieDate === storedDate;
			}
			return false;
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	public async createSession(sessionId: string): Promise<Session> {
		console.log('Creating session: ', sessionId);
		let sessionProperties: SessionProperties = { customSessionId: sessionId };
		const session = await this.openvidu.createSession(sessionProperties);
		await session.fetch();
		return session;
	}

	public createConnection(session: Session, nickname: string, role: OpenViduRole): Promise<Connection> {
		console.log(`Requesting token for session ${session.sessionId}`);
		let connectionProperties: ConnectionProperties = { role };
		if (!!nickname) {
			connectionProperties.data = JSON.stringify({
				openviduCustomConnectionId: nickname
			});
		}
		console.log('Connection Properties:', connectionProperties);
		return session.createConnection(connectionProperties);
	}

	public async startRecording(sessionId: string): Promise<Recording> {
		return this.openvidu.startRecording(sessionId);
	}

	public stopRecording(recordingId: string): Promise<Recording> {
		return this.openvidu.stopRecording(recordingId);
	}

	public deleteRecording(recordingId: string): Promise<Error> {
		return this.openvidu.deleteRecording(recordingId);
	}
	public getRecording(recordingId: string): Promise<Recording> {
		return this.openvidu.getRecording(recordingId);
	}

	public async listAllRecordings(): Promise<Recording[]> {
		return await this.openvidu.listRecordings();
	}

	public async listRecordingsBySessionIdAndDate(sessionId: string, date: number) {
		const recordingList: Recording[] = await this.listAllRecordings();
		return recordingList.filter((recording) => recording.sessionId === sessionId && date <= recording.createdAt);
	}
}
