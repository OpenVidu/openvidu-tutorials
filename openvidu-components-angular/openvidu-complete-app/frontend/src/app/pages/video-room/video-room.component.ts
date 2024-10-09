import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
	BroadcastingStartRequestedEvent,
	BroadcastingStopRequestedEvent,
	RecordingDeleteRequestedEvent,
	RecordingStartRequestedEvent,
	RecordingStopRequestedEvent,
	OpenViduComponentsModule,
	ApiDirectiveModule
} from 'openvidu-components-angular';
import { MatIcon } from '@angular/material/icon';

import { HttpService } from '@services/http.service';

@Component({
	selector: 'app-video-room',
	templateUrl: './video-room.component.html',
	styleUrls: ['./video-room.component.scss'],
	standalone: true,
	imports: [OpenViduComponentsModule, ApiDirectiveModule, MatIcon]
})
export class VideoRoomComponent implements OnInit {
	roomName = '';
	token: string;
	isSessionAlive = false;
	serverError = '';
	loading = true;

	constructor(
		private httpService: HttpService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	async ngOnInit() {
		this.route.params.subscribe((params: Params) => {
			this.roomName = params.roomName;
		});
	}

	async onTokenRequested(participantName: string) {
		try {
			const { token } = await this.httpService.getToken(this.roomName, participantName);
			this.token = token;
		} catch (error) {
			console.error(error);
			this.serverError = error.error;
		} finally {
			this.loading = false;
		}
	}

	onRoomDisconnected() {
		this.isSessionAlive = false;
		console.log('onLeaveButtonClicked');
		this.router.navigate([`/`]);
	}

	async onRecordingStartRequested(event: RecordingStartRequestedEvent) {
		try {
			const { roomName } = event;
			await this.httpService.startRecording(roomName);
		} catch (error) {
			console.error(error);
		}
	}

	async onRecordingStopRequested(event: RecordingStopRequestedEvent) {
		try {
			const { recordingId } = event;

			if(!recordingId) throw new Error('Recording ID not found when stopping recording');

			await this.httpService.stopRecording(recordingId);
		} catch (error) {
			console.error(error);
		}
	}

	async onRecordingDeleteRequested(event: RecordingDeleteRequestedEvent) {
		try {
			const { recordingId } = event;

			if(!recordingId) throw new Error('Recording ID not found when deleting recording');

			await this.httpService.deleteRecording(recordingId);
		} catch (error) {
			console.error(error);
		}
	}

	async onBroadcastingStartRequested(event: BroadcastingStartRequestedEvent) {
		try {
			const { roomName, broadcastUrl } = event;
			await this.httpService.startBroadcasting(roomName, broadcastUrl);
		} catch (error) {
			console.error(error);
		}
	}

	async onBroadcastingStopRequested(event: BroadcastingStopRequestedEvent) {
		try {
			const { broadcastingId } = event;
			await this.httpService.stopBroadcasting(broadcastingId);
		} catch (error) {
			console.error(error);
		}
	}
}
