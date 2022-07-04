import { Component, OnInit } from '@angular/core';
import { TokenModel } from 'openvidu-angular';
import { catchError, throwError as observableThrowError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-root',
  template: `
		<ov-videoconference [tokens]="tokens" [toolbarDisplaySessionName]="false">
			<div *ovParticipantPanelItem="let participant" style="display: flex">
				<p>{{ participant.nickname }}</p>
				<button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
				<mat-menu #menu="matMenu">
					<button mat-menu-item>Button 1</button>
					<button mat-menu-item>Button 2</button>
				</mat-menu>
			</div>
		</ov-videoconference>
  `,
  styles: []
})
export class AppComponent implements OnInit{
  title = 'openvidu-custom-participant-panel-item';
  tokens!: TokenModel;
	sessionId = 'participants-panel-directive-example';
	OPENVIDU_SERVER_URL = 'https://localhost:4443';
	OPENVIDU_SERVER_SECRET = 'MY_SECRET';

	constructor(private httpClient: HttpClient) {}

	async ngOnInit() {
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken()
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

	getToken(): Promise<string> {
		return this.createSession(this.sessionId).then((sessionId: string) => {
			return this.createToken(sessionId);
		});
	}

	createSession(sessionId: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const body = JSON.stringify({ customSessionId: sessionId });
			const options = {
				headers: new HttpHeaders({
					Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
					'Content-Type': 'application/json'
				})
			};
			return this.httpClient
				.post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions', body, options)
				.pipe(
					catchError((error) => {
						if (error.status === 409) {
							resolve(sessionId);
						} else {
							console.warn(
								'No connection to OpenVidu Server. This may be a certificate error at ' + this.OPENVIDU_SERVER_URL
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
								location.assign(this.OPENVIDU_SERVER_URL + '/accept-certificate');
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
					Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
					'Content-Type': 'application/json'
				})
			};
			return this.httpClient
				.post(this.OPENVIDU_SERVER_URL + '/openvidu/api/sessions/' + sessionId + '/connection', body, options)
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
