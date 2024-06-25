import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import {
  ParticipantService,
  OpenViduComponentsModule,
} from 'openvidu-components-angular';

@Component({
  selector: 'app-root',
  template: `
    <ov-videoconference
      [token]="token"
      [livekitUrl]="LIVEKIT_URL"
      (onTokenRequested)="onTokenRequested($event)"
    >
      <div *ovToolbar style="text-align: center;">
        <button (click)="toggleVideo()">Toggle Video</button>
        <button (click)="toggleAudio()">Toggle Audio</button>
      </div>
    </ov-videoconference>
  `,
  standalone: true,
  imports: [OpenViduComponentsModule],
})
export class AppComponent {
  // For local development, leave these variables empty
  // For production, configure them with correct URLs depending on your deployment

  APPLICATION_SERVER_URL = '';
  LIVEKIT_URL = '';
  // The name of the room.
  roomName = 'custom-toolbar';

  // The token used to connect to the videoconference.
  token!: string;

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

  // Called when a token is requested for a participant.
  async onTokenRequested(participantName: string) {
    const { token } = await this.getToken(this.roomName, participantName);
    this.token = token;
  }

  // Toggles the camera on and off.
  async toggleVideo() {
    const isCameraEnabled = this.participantService.isMyCameraEnabled();
    await this.participantService.setCameraEnabled(!isCameraEnabled);
  }

  // Toggles the microphone on and off.
  async toggleAudio() {
    const isMicrophoneEnabled = this.participantService.isMyMicrophoneEnabled();
    await this.participantService.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  // Gets a token for a participant.
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
