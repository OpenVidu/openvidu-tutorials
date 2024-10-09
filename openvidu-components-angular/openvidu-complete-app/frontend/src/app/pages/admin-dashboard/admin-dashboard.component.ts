import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '@services/http.service';
import { StorageAppService } from '@services/storage.service';
import { OpenViduComponentsModule, ApiDirectiveModule } from 'openvidu-components-angular';

@Component({
	selector: 'app-admin-dashboard',
	templateUrl: './admin-dashboard.component.html',
	styleUrls: ['./admin-dashboard.component.scss'],
	standalone: true,
	imports: [OpenViduComponentsModule, ApiDirectiveModule]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
	recordings = [];
	loading = true;
	isParticipantLoggedIn = false;
	error: any;
	private continuationToken: string;
	constructor(
		private httpService: HttpService,
		private storageService: StorageAppService
	) {}

	async ngOnInit() {
		try {
			const adminCredentials = this.storageService.getAdminCredentials();

			if (adminCredentials) {
				await this.onLoginClicked(adminCredentials);
			}
		} catch (error) {
			this.storageService.clearAdminCredentials();
		}

		this.loading = false;
	}

	ngOnDestroy() {
		this.onLogoutClicked();
	}

	async onLoginClicked(credentials: { username: string; password: string }) {
		try {
			await this.httpService.adminLogin(credentials);
			this.storageService.setAdminCredentials(credentials);
			const { recordings, continuationToken } = await this.httpService.getRecordings();
			this.recordings = recordings;
			this.continuationToken = continuationToken;
			this.isParticipantLoggedIn = true;
		} catch (error) {
			console.log(error);
			this.onLogoutClicked();
			this.error = error;
		}
	}

	async onLogoutClicked() {
		try {
			this.isParticipantLoggedIn = false;
			this.storageService.clearAdminCredentials();
			this.recordings = [];
			this.continuationToken = null;
			await this.httpService.adminLogout();
		} catch (error) {
			console.error(error);
		}
	}

	async onLoadMoreRecordingsRequested() {
		if (!this.continuationToken) return console.warn('No more recordings to load');

		const response = await this.httpService.getRecordings(this.continuationToken);
		this.recordings = response.recordings;
		this.continuationToken = response.continuationToken;
	}

	async onRefreshRecordingsClicked() {
		try {
			const response = await this.httpService.getRecordings();
			this.recordings = response.recordings;
			this.continuationToken = response.continuationToken;
		} catch (error) {
			this.onLogoutClicked();
		}
	}

	async onDeleteRecordingClicked(recordingId: string) {
		try {
			await this.httpService.deleteRecordingByAdmin(recordingId);
			const response = await this.httpService.getRecordings();
			this.recordings = response.recordings;
			this.continuationToken = response.continuationToken;
		} catch (error) {
			console.error(error);
		}
	}
}
