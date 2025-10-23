import { animate, style, transition, trigger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

import {
	DataPacket_Kind,
	DataPublishOptions,
	ParticipantService,
	RemoteParticipant,
	Room,
	RoomEvent,
	OpenViduComponentsModule
} from 'openvidu-components-angular';
import { ParticipantAppModel } from './models/participant-app.model';

enum DataTopicApp {
	HAND_TOGGLE = 'handToggle'
}

@Component({
    selector: 'app-root',
    template: `
		<ov-videoconference
			[prejoin]="true"
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			(onTokenRequested)="onTokenRequested($event)"
			(onRoomCreated)="handleRemoteHand($event)"
		>
			<div *ovToolbarAdditionalButtons>
				<button toolbar-btn mat-icon-button (click)="handleLocalHand()" [class.active-btn]="hasHandRaised">
					<mat-icon matTooltip="Toggle hand">front_hand</mat-icon>
				</button>
			</div>

			<div *ovStream="let track" style="height: 100%">
				<ov-stream [track]="track"></ov-stream>
				@if (track.participant.hasHandRaised) {
				<mat-icon @inOutHandAnimation id="hand-notification">front_hand</mat-icon>
				}
			</div>

			<div *ovParticipantPanelItemElements="let participant">
				@if (participant.hasHandRaised) {
				<mat-icon>front_hand</mat-icon>
				}
			</div>
		</ov-videoconference>
	`,
    styles: `
		#call-container, #room-container {
			height: 100%;
		}

		#hand-notification {
			margin-bottom: 5px;
			z-index: 999;
			position: absolute;
			right: 10px;
			bottom: 3px;
		}
	`,
    animations: [
        trigger('inOutHandAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-100%)' }),
                animate('300ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                style({ opacity: 1, transform: 'translateY(0)' }),
                animate('300ms ease-in-out', style({ opacity: 0, transform: 'translateY(-100%)' }))
            ])
        ])
    ],
    imports: [OpenViduComponentsModule, MatIconButton, MatIcon]
})
export class AppComponent {
	// For local development, leave these variables empty
	// For production, configure them with correct URLs depending on your deployment

	APPLICATION_SERVER_URL = '';
	LIVEKIT_URL = '';

	// The token used to connect to the OpenVidu session.
	token!: string;

	// Whether the local participant has raised their hand.
	hasHandRaised: boolean = false;

	// The name of the OpenVidu room.
	private roomName = 'openvidu-toggle-hand';

	constructor(private httpClient: HttpClient, private participantService: ParticipantService) {
		this.configureUrls();
	}

	private configureUrls() {
		// If APPLICATION_SERVER_URL is not configured, use default value from local development
		if (!this.APPLICATION_SERVER_URL) {
			if (window.location.hostname === 'localhost') {
				this.APPLICATION_SERVER_URL = 'http://localhost:6080/';
			} else {
				this.APPLICATION_SERVER_URL = 'https://' + window.location.hostname + ':6443/';
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

	// Requests a token from the application server for the given participant name.
	async onTokenRequested(participantName: string) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	// Handles the reception of a remote hand-raising event.
	handleRemoteHand(room: Room) {
		// Subscribe to hand toggling events from other participants
		room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant, _?: DataPacket_Kind, topic?: string) => {
			if (topic === DataTopicApp.HAND_TOGGLE) {
				const p = this.participantService.getRemoteParticipantBySid(participant.sid);
				if (p) {
					(<ParticipantAppModel>p).toggleHandRaised();
				}
				this.participantService.updateRemoteParticipants();
			}
		});
	}

	// Handles the local hand-raising event.
	async handleLocalHand() {
		// Get local participant with ParticipantService
		const participant = <ParticipantAppModel>this.participantService.getLocalParticipant();

		// Toggle the participant hand with the method we wil add in our ParticipantAppModel
		participant.toggleHandRaised();

		// Refresh the local participant object for others component and services
		this.participantService.updateLocalParticipant();

		// Send a signal with the new value to others participant using the openvidu-browser signal
		const strData = JSON.stringify({});
		const data: Uint8Array = new TextEncoder().encode(strData);
		const options: DataPublishOptions = { topic: DataTopicApp.HAND_TOGGLE };

		await this.participantService.publishData(data, options);
	}

	// Requests a token from the application server for the given room and participant names.
	getToken(roomName: string, participantName: string): Promise<any> {
		try {
			return lastValueFrom(this.httpClient.post<any>(this.APPLICATION_SERVER_URL + 'token', { roomName, participantName }));
		} catch (error: any) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
}
