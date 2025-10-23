import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import {
	DataPacket_Kind,
	DataPublishOptions,
	DataTopic,
	ParticipantService,
	RemoteParticipant,
	Room,
	RoomEvent,
	OpenViduComponentsModule,
} from 'openvidu-components-angular';

@Component({
    selector: 'app-root',
    template: `
		<!-- OpenVidu Video Conference Component -->
		<ov-videoconference
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			[toolbarDisplayRoomName]="false"
			(onTokenRequested)="onTokenRequested($event)"
			(onRoomCreated)="onRoomCreated($event)"
		>
			<!-- Chat Panel -->
			<div *ovChatPanel id="my-panel">
				<h3>Chat</h3>
				<div>
					<ul>
						@for (msg of messages; track msg) {
						<li>{{ msg }}</li>
						}
					</ul>
				</div>
				<input value="Hello" #input />
				<button (click)="send(input.value)">Send</button>
			</div>
		</ov-videoconference>
	`,
    styles: `
		#my-panel {
			background: #aafffc;
			height: 100%;
			overflow: hidden;
			text-align: center;
		}
	`,
    imports: [OpenViduComponentsModule]
})
export class AppComponent {
	// For local development, leave these variables empty
	// For production, configure them with correct URLs depending on your deployment
	APPLICATION_SERVER_URL = '';
	LIVEKIT_URL = '';

	// Define the name of the room and initialize the token variable
	roomName = 'chat-panel-directive-example';
	token!: string;
	messages: string[] = [];

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

	// Function to request a token when a participant joins the room
	async onTokenRequested(participantName: string) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	// Event handler for room creation
	onRoomCreated(room: Room) {
		room.on(
			RoomEvent.DataReceived,
			(
				payload: Uint8Array,
				participant?: RemoteParticipant,
				_?: DataPacket_Kind,
				topic?: string
			) => {
				if (topic === DataTopic.CHAT) {
					const { message } = JSON.parse(new TextDecoder().decode(payload));
					const participantName = participant?.name || 'Unknown';
					this.messages.push(message);
					console.log(`Message received from ${participantName}:`, message);
				}
			}
		);
	}

	// Function to send a chat message
	async send(message: string): Promise<void> {
		const strData = JSON.stringify({ message });
		const data: Uint8Array = new TextEncoder().encode(strData);
		const options: DataPublishOptions = { topic: DataTopic.CHAT };
		await this.participantService.publishData(data, options);
		this.messages.push(message);
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
