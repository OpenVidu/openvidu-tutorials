import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { lastValueFrom, Subscription } from 'rxjs';
import {
	ParticipantModel,
	ParticipantService,
	OpenViduComponentsModule,
} from 'openvidu-components-angular';
import { NgClass } from '@angular/common';

@Component({
	selector: 'app-root',
	template: `
		<!-- OpenVidu Video Conference Component -->
		<ov-videoconference
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			(onTokenRequested)="onTokenRequested($event)"
		>
			<!-- Custom Layout for Video Streams -->
			<div *ovLayout>
				<div class="container">
					<!-- Local Participant's Tracks -->
					@for (track of localParticipant.tracks; track track) {
					<div
						class="item"
						[ngClass]="{
							hidden:
								track.isAudioTrack && !track.participant.onlyHasAudioTracks
						}"
					>
						<ov-stream [track]="track"></ov-stream>
					</div>
					}

					<!-- Remote Participants' Tracks -->
					@for (track of remoteParticipants | tracks; track track) {
					<div
						class="item"
						[ngClass]="{
							hidden:
								track.isAudioTrack && !track.participant.onlyHasAudioTracks
						}"
					>
						<ov-stream [track]="track"></ov-stream>
					</div>
					}
				</div>
			</div>
		</ov-videoconference>
	`,
	styles: `
		.container {
			display: flex;
			flex-wrap: wrap;
			justify-content: space-between;
		}
		.item {
			flex: 0 50%;
			height: 250px;
			margin-bottom: 2%;
		}
		.hidden {
			display: none;
		}
	`,
	standalone: true,
	imports: [OpenViduComponentsModule, NgClass],
})
export class AppComponent implements OnInit, OnDestroy {
	// For local development, leave these variables empty
	// For production, configure them with correct URLs depending on your deployment
	APPLICATION_SERVER_URL = '';
	LIVEKIT_URL = '';

	// Define the name of the room and initialize the token variable
	roomName = 'custom-layout';
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

	ngOnInit() {
		// Subscribe to participants' updates
		this.subscribeToParticipants();
	}

	// Function to request a token when a participant joins the room
	async onTokenRequested(participantName: string) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	ngOnDestroy() {
		// Unsubscribe from participant updates to prevent memory leaks
		this.localParticipantSubs.unsubscribe();
		this.remoteParticipantsSubs.unsubscribe();
	}

	// Subscribe to updates for local and remote participants
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
