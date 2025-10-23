import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { OpenViduComponentsModule } from 'openvidu-components-angular';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-root',
    template: `
		<ov-videoconference
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			[toolbarDisplayRoomName]="false"
			(onTokenRequested)="onTokenRequested($event)"
		>
			<div *ovToolbarAdditionalPanelButtons style="text-align: center;">
				<button mat-icon-button (click)="onButtonClicked()">
					<mat-icon>star</mat-icon>
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

	// Set the room name
	roomName = 'toolbar-additional-panel-btn';

	// Initialize the token variable
	token!: string;

	constructor(private httpClient: HttpClient) {
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

	// Method to request a token for a participant
	async onTokenRequested(participantName: string) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	// Method to handle button click
	onButtonClicked() {
		alert('button clicked');
	}

	// Method to get a token from the backend
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
