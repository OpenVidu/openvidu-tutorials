import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { lastValueFrom, Subscription } from 'rxjs';

import {
	ParticipantModel,
	ParticipantService,
	OpenViduComponentsModule,
} from 'openvidu-components-angular';

@Component({
    selector: 'app-root',
    template: `
		<!-- OpenVidu Video Conference Component -->
		<ov-videoconference
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			(onTokenRequested)="onTokenRequested($event)"
		>
			<!-- Custom Participants Panel -->
			<div *ovParticipantsPanel id="my-panel">
				<ul id="local">
					<li>{{ localParticipant.name }}</li>
				</ul>
				<ul id="remote">
					@for (p of remoteParticipants; track p) {
					<li>{{ p.name }}</li>
					}
				</ul>
			</div>
		</ov-videoconference>
	`,
    styles: `
		#my-panel {
			background: #faff7f;
			height: 100%;
			overflow: hidden;
		}
		#my-panel > #local {
			background: #a184ff;
		}
		#my-panel > #remote {
			background: #7fb8ff;
		}
	`,
    imports: [OpenViduComponentsModule]
})
export class AppComponent implements OnInit, OnDestroy {
	// For local development, leave these variables empty
	// For production, configure them with correct URLs depending on your deployment
	APPLICATION_SERVER_URL = '';
	LIVEKIT_URL = '';

	// Define the name of the room and initialize the token variable
	roomName = 'custom-participants-panel';
	token!: string;

	// Participant-related properties
	localParticipant!: ParticipantModel;
	remoteParticipants!: ParticipantModel[];
	localParticipantSubs!: Subscription;
	remoteParticipantsSubs!: Subscription;

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

	// Subscribes to updates for local and remote participants.
	ngOnInit() {
		this.subscribeToParticipants();
	}

	// Unsubscribes from updates for local and remote participants to prevent memory leaks.
	ngOnDestroy() {
		this.localParticipantSubs.unsubscribe();
		this.remoteParticipantsSubs.unsubscribe();
	}

	// Function called when a participant requests a token to join the room.
	async onTokenRequested(participantName: string) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	// Subscribes to updates for local and remote participants.
	subscribeToParticipants() {
		this.localParticipantSubs =
			this.participantService.localParticipant$.subscribe((p) => {
				if (p) this.localParticipant = p;
			});

		this.remoteParticipantsSubs =
			this.participantService.remoteParticipants$.subscribe(
				(participants) => {
					this.remoteParticipants = participants;
				}
			);
	}

	// Sends a request to the server to obtain a token for a participant.
	async getToken(roomName: string, participantName: string): Promise<any> {
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
