import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, lastValueFrom, Observable } from 'rxjs';
import { RecordingInfo } from 'openvidu-angular';

@Injectable({
	providedIn: 'root'
})
export class RestService {
	private baseHref: string;

	constructor(private http: HttpClient) {
		this.baseHref = '/' + (!!window.location.pathname.split('/')[1] ? window.location.pathname.split('/')[1] + '/' : '');
	}
	async getTokens(
		sessionId: string,
		nickname?: string
	): Promise<{ cameraToken: string, screenToken: string, recordingEnabled: boolean, recordings?: RecordingInfo[] }> {
		return this.postRequest('sessions', { sessionId, nickname });
	}
	login(password: string): Promise<any[]> {
		return this.postRequest('admin/login', { password });
	}
	logout(): Promise<void> {
		return this.postRequest('admin/logout', {});
	}

	getRecordings() {
		return this.getRequest(`recordings/`);
	}

	startRecording(sessionId: string) {
		return this.postRequest('recordings/start', { sessionId });
	}

	stopRecording(sessionId: string) {
		return this.postRequest('recordings/stop', { sessionId });
	}

	deleteRecording(recordingId: string): Promise<RecordingInfo[]> {
		return this.deleteRequest(`recordings/delete/${recordingId}`);
	}

	private postRequest(path: string, body: any): any {
		try {
			return lastValueFrom(this.http.post<any>(this.baseHref + path, body));
		} catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}

	private getRequest(path: string, responseType?: string): any {
		try {
			const options = {};
			if (responseType) {
				options['responseType'] = responseType;
			}
			return lastValueFrom(this.http.get(`${this.baseHref}${path}`, options));
		} catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}

	private deleteRequest(path: string) {
		try {
			return lastValueFrom(this.http.delete<any>(`${this.baseHref}${path}`));
		} catch (error) {
			console.log(error);
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
}
