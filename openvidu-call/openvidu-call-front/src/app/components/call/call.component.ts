import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ParticipantService, RecordingInfo, RecordingService, TokenModel } from 'openvidu-angular';

import { RestService } from '../../services/rest.service';

@Component({
	selector: 'app-call',
	templateUrl: './call.component.html',
	styleUrls: ['./call.component.css']
})
export class CallComponent implements OnInit {
	sessionId = '';
	tokens: TokenModel;
	joinSessionClicked: boolean = false;
	closeClicked: boolean = false;
	isSessionAlive: boolean = false;
	recordingEnabled: boolean = true;
	recordingList: RecordingInfo[] = [];
	recordingError: any;

	constructor(
		private restService: RestService,
		private participantService: ParticipantService,
		private recordingService: RecordingService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	async ngOnInit() {
		this.route.params.subscribe((params: Params) => {
			this.sessionId = params.roomName;
		});

		let nickname: string = '';
		// Just for debugging purposes
		const regex = /^UNSAFE_DEBUG_USE_CUSTOM_IDS_/gm;
		const match = regex.exec(this.sessionId);
		if (match && match.length > 0) {
			console.warn('DEBUGGING SESSION');
			nickname = this.participantService.getLocalParticipant().getNickname();
		}

		const response = await this.restService.getTokens(this.sessionId, nickname);
		this.recordingEnabled = response.recordingEnabled;
		this.recordingList = response.recordings;
		this.tokens = {
			webcam: response.cameraToken,
			screen: response.screenToken
		};
	}
	onLeaveButtonClicked() {
		this.isSessionAlive = false;
		this.closeClicked = true;
		this.router.navigate([`/`]);
	}
	async onStartRecordingClicked() {
		try {
			await this.restService.startRecording(this.sessionId);
		} catch (error) {
			this.recordingError = error;
		}
	}

	async onStopRecordingClicked() {
		try {
			this.recordingList = await this.restService.stopRecording(this.sessionId);
		} catch (error) {
			this.recordingError = error;
		}
	}

	async onDeleteRecordingClicked(recordingId: string) {
		try {
			this.recordingList = await this.restService.deleteRecording(recordingId);
		} catch (error) {
			this.recordingError = error;
		}
	}
	async onDownloadRecordingClicked(recordingId: string) {
		try {
			const file = await this.restService.downloadRecording(recordingId);
			this.recordingService.downloadRecording(recordingId, file);
		} catch (error) {
			this.recordingError = error;
		}
	}
}
