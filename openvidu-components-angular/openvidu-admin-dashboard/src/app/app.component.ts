import { Component, WritableSignal, signal } from '@angular/core';
import {
	RecordingInfo,
	OpenViduComponentsModule,
	RecordingStatus,
	RecordingOutputMode,
	RecordingDeleteRequestedEvent,
} from 'openvidu-components-angular';

@Component({
	selector: 'app-root',
	template: `
		@if (logged) {
		<ov-admin-dashboard
			[recordingsList]="recordings()"
			(onLogoutRequested)="onLogoutRequested()"
			(onRefreshRecordingsRequested)="onRefreshRecordingsRequested()"
			(onLoadMoreRecordingsRequested)="onLoadMoreRecordingsRequested()"
			(onRecordingDeleteRequested)="onRecordingDeleteRequested($event)"
		></ov-admin-dashboard>
		} @else {
		<ov-admin-login (onLoginRequested)="onLoginRequested($event)">
		</ov-admin-login>
		}
	`,
	standalone: true,
	imports: [OpenViduComponentsModule],
})
export class AppComponent {
	roomName = 'openvidu-admin-dashboard';
	logged: boolean = false;
	recordings: WritableSignal<RecordingInfo[]> = signal([
		{
			id: 'recording1',
			roomName: this.roomName,
			roomId: 'roomId1',
			outputMode: RecordingOutputMode.COMPOSED,
			status: RecordingStatus.READY,
			filename: 'sampleRecording.mp4',
			startedAt: new Date().getTime(),
			endedAt: new Date().getTime(),
			duration: 0,
			size: 100,
			location: 'http://localhost:8080/recordings/recording1',
		},
	]);

	constructor() {}

	onLoginRequested(credentials: { username: string; password: string }) {
		console.log(`Loggin button clicked ${credentials}`);
		/**
		 * WARNING! This code is developed for didactic purposes only.
		 * The authentication process should be done in the server side.
		 **/
		this.logged = true;
	}

	onLogoutRequested() {
		console.log('Logout button clicked');
		/**
		 * WARNING! This code is developed for didactic purposes only.
		 * The authentication process should be done in the server side.
		 **/
		this.logged = false;
	}

	onRefreshRecordingsRequested() {
		console.log('Refresh recording clicked');
		/**
		 * WARNING! This code is developed for didactic purposes only.
		 * The authentication process should be done in the server side.
		 **/
		// Getting the recordings from the server
		this.recordings.update(() => [
			{
				id: 'recording1',
				roomName: this.roomName,
				roomId: 'roomId1',
				outputMode: RecordingOutputMode.COMPOSED,
				status: RecordingStatus.READY,
				filename: 'sampleRecording1.mp4',
				startedAt: new Date().getTime(),
				endedAt: new Date().getTime(),
				duration: 0,
				size: 100,
				location: 'http://localhost:8080/recordings/recording1',
			},
		]);
	}

	onLoadMoreRecordingsRequested() {
		console.log('Load more recordings clicked');
	}

	onRecordingDeleteRequested(recording: RecordingDeleteRequestedEvent) {
		console.log(`Delete recording clicked ${recording.recordingId}`);
		/**
		 * WARNING! This code is developed for didactic purposes only.
		 * The authentication process should be done in the server side.
		 **/
		// Deleting the recording from the server
		this.recordings.update((recordings) =>
			recordings.filter((rec) => rec.id !== recording.recordingId)
		);

		console.log(this.recordings());
	}
}
