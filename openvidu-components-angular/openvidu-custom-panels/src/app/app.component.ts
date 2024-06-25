import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { OpenViduComponentsModule } from 'openvidu-components-angular';

@Component({
	selector: 'app-root',
	template: `
		<!-- OpenVidu Video Conference Component -->
		<ov-videoconference
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			(onTokenRequested)="onTokenRequested($event)"
		>
			<!-- Custom Panels -->
			<ov-panel *ovPanel>
				<!-- Custom Chat Panel -->
				<div *ovChatPanel id="my-chat-panel">This is my custom chat panel</div>

				<!-- Custom Participants Panel -->
				<div *ovParticipantsPanel id="my-participants-panel">
					This is my custom participants panel
				</div>

				<!-- Custom Activities Panel -->
				<div *ovActivitiesPanel id="my-activities-panel">
					This is my custom activities panel
				</div>
			</ov-panel>
		</ov-videoconference>
	`,
	styles: `
		#my-chat-panel,
		#my-participants-panel,
		#my-activities-panel {
			text-align: center;
			height: calc(100% - 40px);
			margin: 20px;
		}

		#my-chat-panel {
			background: #c9ffb2;
		}

		#my-participants-panel {
			background: #ddf2ff;
		}

		#my-activities-panel {
			background: #ffddc9;
		}
	`,
	standalone: true,
	imports: [OpenViduComponentsModule],
})
export class AppComponent {
	// For local development, leave these variables empty
	// For production, configure them with correct URLs depending on your deployment
	APPLICATION_SERVER_URL = '';
	LIVEKIT_URL = '';

	// Define the name of the room and initialize the token variable
	roomName = 'custom-panels';
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

	// Function to request a token when a participant joins the room
	async onTokenRequested(participantName: string) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	// Function to get a token from the server
	getToken(roomName: string, participantName: string): Promise<any> {
		try {
			// Send a POST request to the server to obtain a token
			return lastValueFrom(
				this.httpClient.post<any>(this.APPLICATION_SERVER_URL + 'token', {
					roomName,
					participantName,
				})
			);
		} catch (error: any) {
			// Handle errors, e.g., if the server is not reachable
			if (error.status === 404) {
				throw {
					status: error.status,
					message:
						'Cannot connect with the backend. ' + error.url + ' not found',
				};
			}
			throw error;
		}
	}
}
