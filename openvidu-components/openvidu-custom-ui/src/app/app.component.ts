import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { catchError, throwError as observableThrowError } from 'rxjs';

import { TokenModel } from 'openvidu-angular';

@Component({
  selector: 'app-root',
  template: `
    <ov-videoconference
      (onJoinButtonClicked)="onJoinButtonClicked()"
      [tokens]="tokens"
    ></ov-videoconference>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'openvidu-custom-ui';
  tokens!: TokenModel;
  private sessionId = 'openvidu-toggle-hand';
  private OPENVIDU_SERVER_URL = 'https://' + location.hostname + ':4443';
  private OPENVIDU_SERVER_SECRET = 'MY_SECRET';

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {}

  async onJoinButtonClicked() {
    this.tokens = {
      webcam: await this.getToken(),
      screen: await this.getToken(),
    };
  }

  /**
   * --------------------------
   * SERVER-SIDE RESPONSIBILITY
   * --------------------------
   * This method retrieve the mandatory user token from OpenVidu Server,
   * in this case making use Angular http API.
   * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION. In this case:
   *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
   *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
   *   3) The Connection.token must be consumed in Session.connect() method
   */

  async getToken(): Promise<string> {
    try {
      const sessionId = await this.createSession(this.sessionId);
      return this.createToken(sessionId);
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  createSession(sessionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ customSessionId: sessionId });
      const options = {
        headers: new HttpHeaders({
          Authorization:
            'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
          'Content-Type': 'application/json',
        }),
      };
      return this.httpClient
        .post(
          this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions',
          body,
          options
        )
        .pipe(
          catchError((error) => {
            if (error.status === 409) {
              resolve(sessionId);
            } else {
              console.warn(
                'No connection to OpenVidu Server. This may be a certificate error at ' +
                  this.OPENVIDU_SERVER_URL
              );
              if (
                window.confirm(
                  'No connection to OpenVidu Server. This may be a certificate error at "' +
                    this.OPENVIDU_SERVER_URL +
                    '"\n\nClick OK to navigate and accept it. If no certificate warning is shown, then check that your OpenVidu Server' +
                    'is up and running at "' +
                    this.OPENVIDU_SERVER_URL +
                    '"'
                )
              ) {
                location.assign(
                  this.OPENVIDU_SERVER_URL + '/accept-certificate'
                );
              }
            }
            return observableThrowError(error);
          })
        )
        .subscribe((response: any) => {
          console.log(response);
          resolve(response['id']);
        });
    });
  }

  createToken(sessionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = {};
      const options = {
        headers: new HttpHeaders({
          Authorization:
            'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
          'Content-Type': 'application/json',
        }),
      };
      return this.httpClient
        .post(
          this.OPENVIDU_SERVER_URL +
            '/openvidu/api/sessions/' +
            sessionId +
            '/connection',
          body,
          options
        )
        .pipe(
          catchError((error) => {
            reject(error);
            return observableThrowError(error);
          })
        )
        .subscribe((response: any) => {
          console.log(response);
          resolve(response['token']);
        });
    });
  }
}
