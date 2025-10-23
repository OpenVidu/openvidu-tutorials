import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import {
	PanelStatusInfo,
	PanelService,
	OpenViduComponentsModule,
} from 'openvidu-components-angular';

import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';


@Component({
    selector: 'app-root',
    template: `
		<!-- OpenVidu Video Conference Component -->
		<ov-videoconference
			[token]="token"
			[livekitUrl]="LIVEKIT_URL"
			[toolbarDisplayRoomName]="false"
			(onTokenRequested)="onTokenRequested($event)"
		>
			<!-- Additional Toolbar Buttons -->
			<div *ovToolbarAdditionalPanelButtons style="text-align: center;">
				<button mat-icon-button (click)="toggleMyPanel('my-panel1')">
					<mat-icon>360</mat-icon>
				</button>
				<button mat-icon-button (click)="toggleMyPanel('my-panel2')">
					<mat-icon>star</mat-icon>
				</button>
			</div>

			<!-- Additional Panels -->
			<div *ovAdditionalPanels id="my-panels">
				@if (showExternalPanel) {
				<div id="my-panel1">
					<h2>NEW PANEL 1</h2>
					<p>This is my new additional panel</p>
				</div>
				} @if (showExternalPanel2) {
				<div id="my-panel2">
					<h2>NEW PANEL 2</h2>
					<p>This is another new panel</p>
				</div>
				}
			</div>
		</ov-videoconference>
	`,
    styles: `
		#my-panels {
			height: 100%;
			overflow: hidden;
		}
		#my-panel1,
		#my-panel2 {
			text-align: center;
			height: calc(100% - 40px);
			margin: 20px;
		}
		#my-panel1 {
			background: #c9ffb2;
		}
		#my-panel2 {
			background: #ddf2ff;
		}
	`,
    imports: [OpenViduComponentsModule, MatIconButton, MatIcon]
})
export class AppComponent {
	// For local development, leave these variables empty
	// For production, configure them with correct URLs depending on your deployment
	APPLICATION_SERVER_URL = '';
	LIVEKIT_URL = '';

	// Define the name of the room and initialize the token variable
	roomName = 'additional-panels';
	token!: string;

	// Flags to control the visibility of external panels
	showExternalPanel: boolean = false;
	showExternalPanel2: boolean = false;

	constructor(
		private httpClient: HttpClient,
		private panelService: PanelService
	) {
		this.configureUrls();
	}

	ngOnInit() {
		this.subscribeToPanelToggling();
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
	async onTokenRequested(participantName: any) {
		const { token } = await this.getToken(this.roomName, participantName);
		this.token = token;
	}

	// Subscribe to panel toggling events
	subscribeToPanelToggling() {
		this.panelService.panelStatusObs.subscribe((ev: PanelStatusInfo) => {
			this.showExternalPanel = ev.isOpened && ev.panelType === 'my-panel1';
			this.showExternalPanel2 = ev.isOpened && ev.panelType === 'my-panel2';
		});
	}

	// Toggle the visibility of external panels
	toggleMyPanel(type: string) {
		this.panelService.togglePanel(type);
	}

	// Function to get a token from the server
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
