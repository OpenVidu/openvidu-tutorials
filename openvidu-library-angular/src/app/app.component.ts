import { Component, ViewChild } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {OpenviduSessionComponent, StreamEvent, Session, UserModel, OpenViduLayout, OvSettings, OpenViduLayoutOptions, SessionDisconnectedEvent, Publisher} from 'openvidu-angular';

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
  tokens: string[] = [];
  session = false;

  ovSession: Session;
  ovLocalUsers: UserModel[];
  ovLayout: OpenViduLayout;
  ovLayoutOptions: OpenViduLayoutOptions;

  @ViewChild('ovSessionComponent')
  public ovSessionComponent: OpenviduSessionComponent;

  constructor(private httpClient: HttpClient) { }

  async joinSession() {
    const token1 = await this.getToken();
    const token2 = await this.getToken();
    this.tokens.push(token1, token2);
    this.session = true;
  }

  handlerSessionCreatedEvent(session: Session): void {

    // You can see the session documentation here
    // https://docs.openvidu.io/en/stable/api/openvidu-browser/classes/session.html

    console.log('SESSION CREATED EVENT', session);

    session.on('streamCreated', (event: StreamEvent) => {
      // Do something
    });

    session.on('streamDestroyed', (event: StreamEvent) => {
      // Do something
    });

    session.on('sessionDisconnected', (event: SessionDisconnectedEvent) => {
      this.session = false;
      this.tokens = [];
    });

    this.myMethod();

  }

  handlerPublisherCreatedEvent(publisher: Publisher) {

    // You can see the publisher documentation here
    // https://docs.openvidu.io/en/stable/api/openvidu-browser/classes/publisher.html

    publisher.on('streamCreated', (e) => {
      console.log('Publisher streamCreated', e);
    });

  }

  handlerErrorEvent(event): void {
    // Do something
  }

  myMethod() {
    this.ovLocalUsers = this.ovSessionComponent.getLocalUsers();
    this.ovLayout = this.ovSessionComponent.getOpenviduLayout();
    this.ovLayoutOptions = this.ovSessionComponent.getOpenviduLayoutOptions();
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
        .post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions', body, options)
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
      const body = JSON.stringify({});
      const options = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
          'Content-Type': 'application/json',
        }),
      };
      return this.httpClient
        .post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions/' + sessionId + '/connection', body, options)
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
