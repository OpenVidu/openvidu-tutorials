import { Injectable } from '@angular/core';
import { LoggerService, StorageService } from 'openvidu-components-angular';
import { STORAGE_PREFIX, StorageAppKeys } from '../models/storage.model';

/**
 * @internal
 */
@Injectable({
	providedIn: 'root'
})
export class StorageAppService extends StorageService {
	constructor(loggerSrv: LoggerService) {
		super(loggerSrv);
		this.PREFIX_KEY = STORAGE_PREFIX;
	}

	setAdminCredentials(credentials: { username: string; password: string }) {
		const encodedCredentials = btoa(`${credentials.username}:${credentials.password}`);
		this.set(StorageAppKeys.ADMIN_CREDENTIALS, encodedCredentials);
	}

	getAdminCredentials(): { username: string; password: string } | undefined {
		const encodedCredentials = this.get(StorageAppKeys.ADMIN_CREDENTIALS);

		if (encodedCredentials) {
			const [username, password] = atob(encodedCredentials).split(':');
			return { username, password };
		}

		return undefined;
	}

	clearAdminCredentials() {
		this.remove(StorageAppKeys.ADMIN_CREDENTIALS);
	}

	setParticipantCredentials(credentials: { username: string; password: string }) {
		const encodedCredentials = btoa(`${credentials.username}:${credentials.password}`);
		this.setParticipantName(credentials.username);
		this.set(StorageAppKeys.PARTICIPANT_CREDENTIALS, encodedCredentials);
	}

	getParticipantCredentials(): { username: string; password: string } | null {
		const encodedCredentials = this.get(StorageAppKeys.PARTICIPANT_CREDENTIALS);

		if (encodedCredentials) {
			const [username, password] = atob(encodedCredentials).split(':');
			return { username, password };
		}

		return null;
	}

	clearParticipantCredentials() {
		this.remove(StorageAppKeys.PARTICIPANT_CREDENTIALS);
	}
}
