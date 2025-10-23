import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import {
  OpenViduComponentsModule,
  ApiDirectiveModule,
} from 'openvidu-components-angular';

@Component({
    selector: 'app-root',
    template: `<ov-videoconference
    [token]="token"
    [livekitUrl]="LIVEKIT_URL"
    [lang]="'es'"
    [langOptions]="[
      { name: 'English', lang: 'en' },
      { name: 'custom', lang: 'custom' }
    ]"
    (onTokenRequested)="onTokenRequested($event)"
  ></ov-videoconference>`,
    styles: [''],
    imports: [OpenViduComponentsModule, ApiDirectiveModule]
})
export class AppComponent {
  // For local development, leave these variables empty
  // For production, configure them with correct URLs depending on your deployment
  APPLICATION_SERVER_URL = '';
  LIVEKIT_URL = '';

  // The name of the room to join.
  roomName = 'openvidu-custom-lang';

  // The token used to join the room.
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

  // Requests a token to join the room with the given participant name.
  async onTokenRequested(participantName: string) {
    const { token } = await this.getToken(this.roomName, participantName);
    this.token = token;
  }

  // Retrieves a token to join the room with the given name and participant name.
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
