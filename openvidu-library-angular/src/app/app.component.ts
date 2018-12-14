import { Component, ViewChild } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {OpenviduSessionComponent, StreamEvent, Session, UserModel, OpenViduLayout, OpenViduLayoutOptions} from 'openvidu-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  OPENVIDU_SERVER_URL = 'https://' + location.hostname + ':4443';
  OPENVIDU_SERVER_SECRET = 'MY_SECRET';

  // Join form
  mySessionId = 'SessionA';
  myUserName = 'Participant' + Math.floor(Math.random() * 100);
  token: string;
  session = false;

  ovSession: Session;
  ovLocalUser: UserModel;
  ovLayout: OpenViduLayout;
  ovLayoutOptions: OpenViduLayoutOptions;

  @ViewChild('ovSessionComponent')
  public ovSessionComponent: OpenviduSessionComponent;

  constructor(private httpClient: HttpClient) { }

  joinSession() {
    this.getToken().then((token) => {
      this.token = token;
      this.session = true;
    });
  }

  handlerJoinSessionEvent(event): void {
    this.myMethod();
  }

  handlerLeaveSessionEvent(event): void {
    this.session = false;
  }

  handlerErrorEvent(event): void {
    // Do something
  }

  myMethod() {

    this.ovSession = this.ovSessionComponent.getSession();
    this.ovLocalUser = this.ovSessionComponent.getLocalUser();
    this.ovLayout = this.ovSessionComponent.getOpenviduLayout();
    this.ovLayoutOptions = this.ovSessionComponent.getOpenviduLayoutOptions();

    this.ovSession.on('streamCreated', (event: StreamEvent) => {
      // Do something
    });

    this.ovSession.on('streamDestroyed', (event: StreamEvent) => {
      // Do something
    });
  }

  /**
   * --------------------------
   * SERVER-SIDE RESPONSIBILITY
   * --------------------------
   * This method retrieve the mandatory user token from OpenVidu Server,
   * in this case making use Angular http API.
   * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION. In this case:
   *   1) Initialize a session in OpenVidu Server	 (POST /api/sessions)
   *   2) Generate a token in OpenVidu Server		   (POST /api/tokens)
   *   3) The token must be consumed in Session.connect() method of OpenVidu Browser
   */

  getToken(): Promise<string> {
    return this.createSession(this.mySessionId).then((sessionId) => {
      return this.createToken(sessionId);
    });
  }

  createSession(sessionId) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ customSessionId: sessionId });
      const options = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
          'Content-Type': 'application/json',
        }),
      };
      return this.httpClient
        .post(this.OPENVIDU_SERVER_URL + '/api/sessions', body, options)
        .pipe(
          catchError((error) => {
            if (error.status === 409) {
              resolve(sessionId);
            } else {
              console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + this.OPENVIDU_SERVER_URL);
              if (
                window.confirm(
                  'No connection to OpenVidu Server. This may be a certificate error at "' +
                    this.OPENVIDU_SERVER_URL +
                    '"\n\nClick OK to navigate and accept it. If no certificate warning is shown, then check that your OpenVidu Server' +
                    'is up and running at "' +
                    this.OPENVIDU_SERVER_URL +
                    '"',
                )
              ) {
                location.assign(this.OPENVIDU_SERVER_URL + '/accept-certificate');
              }
            }
            return observableThrowError(error);
          }),
        )
        .subscribe((response) => {
          console.log(response);
          resolve(response['id']);
        });
    });
  }

  createToken(sessionId): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ session: sessionId });
      const options = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
          'Content-Type': 'application/json',
        }),
      };
      return this.httpClient
        .post(this.OPENVIDU_SERVER_URL + '/api/tokens', body, options)
        .pipe(
          catchError((error) => {
            reject(error);
            return observableThrowError(error);
          }),
        )
        .subscribe((response) => {
          console.log(response);
          resolve(response['token']);
        });
    });
  }
}
