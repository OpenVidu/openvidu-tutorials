import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import {
	ParticipantService,
	OpenViduComponentsModule,
} from 'openvidu-components-angular';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
    selector: 'app-root',
    template: `
		<ov-videoconference
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			(onTokenRequested)="onTokenRequested($event)"
		>
			<div *ovToolbarAdditionalButtons style="text-align: center;">
				<button mat-icon-button (click)="toggleVideo()">
					<mat-icon>videocam</mat-icon>
				</button>
				<button mat-icon-button (click)="toggleAudio()">
					<mat-icon>mic</mat-icon>
				</button>
			</div>
		</ov-videoconference>
	`,
    styles: [],
    imports: [OpenViduComponentsModule, MatIconButton, MatIcon]
})
export class AppComponent {
	// For local development, leave these variables empty
	// For production, configure them with correct URLs depending on your deployment

	APPLICATION_SERVER_URL = '';
	LIVEKIT_URL = '';

	// The name of the room for the video conference.
	roomName = 'toolbar-additionalbtn';

	// The token used to authenticate the user in the video conference.
	token!: string;

	constructor(
		private httpClient: HttpClient,
		private participantService: ParticipantService
	) {
		this.configureUrls();
	}

	private configureUrls() {
		// If APPLICATION_SERVER_URL is not configured, use default value from local development
		if (!this.APPLICATION_SERVER_URL) {
			if (window.location.hostname === 'localhost') {
				this.APPLICATION_SERVER_URL = 'http://localhost:6080/';
			} else {
				this.APPLICATION_SERVER_URL =
					'https://' + window.location.hostname + ':6443/';
			}
		}

		// If LIVEKIT_URL is not configured, use default value from local development
		if (!this.LIVEKIT_URL) {
			if (window.location.hostname === 'localhost') {
				this.LIVEKIT_URL = 'ws://localhost:7880/';
			} else {
				this.LIVEKIT_URL = 'wss://' + window.location.hostname + ':7443/';
			}
		}
	}

	// Called when the token is requested.
	async onTokenRequested(participantName: string) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	// Toggles the camera on/off.
	async toggleVideo() {
		const isCameraEnabled = this.participantService.isMyCameraEnabled();
		await this.participantService.setCameraEnabled(!isCameraEnabled);
	}

	// Toggles the microphone on/off.
	async toggleAudio() {
		const isMicrophoneEnabled = this.participantService.isMyMicrophoneEnabled();
		await this.participantService.setMicrophoneEnabled(!isMicrophoneEnabled);
	}

	// Retrieves a token from the server to authenticate the user.
	getToken(roomName: string, participantName: string): Promise<any> {
		try {
			return lastValueFrom(
				this.httpClient.post<any>(this.APPLICATION_SERVER_URL + 'token', {
					roomName,
					participantName,
				})
			);
		} catch (error: any) {
			if (error.status === 404) {
				throw {
					status: error.status,
					message: 'Cannot connect with backend. ' + error.url + ' not found',
				};
			}
			throw error;
		}
	}
}
