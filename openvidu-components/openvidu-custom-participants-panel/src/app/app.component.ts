import { Component, OnInit } from '@angular/core';
import { ParticipantAbstractModel, ParticipantService, TokenModel } from 'openvidu-angular';
import { Subscription } from 'rxjs';
import { catchError, throwError as observableThrowError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-root',
  template: `
		<ov-videoconference [tokens]="tokens" [toolbarDisplaySessionName]="false">
			<div *ovParticipantsPanel id="my-panel">
				<ul id="local">
					<li>{{localParticipant.nickname}}</li>
				</ul>

				<ul id="remote">
					<li *ngFor="let p of remoteParticipants">{{p.nickname}}</li>
				</ul>
			</div>
		</ov-videoconference>

  `,
  styles: [
    `
			#my-panel {
				background: #faff7f;
				height: 100%;
				overflow: hidden;
			}
			#my-panel > #local {
				background: #a184ff;
			}
			#my-panel > #remote {
				background: #7fb8ff;
			}
		`
  ]
})
export class AppComponent implements OnInit {
  title = 'openvidu-custom-participants-panel';
  tokens!: TokenModel;
	sessionId = 'participants-panel-directive-example';
	OPENVIDU_SERVER_URL = 'https://localhost:4443';
	OPENVIDU_SERVER_SECRET = 'MY_SECRET';
	localParticipant!: ParticipantAbstractModel;
	remoteParticipants!: ParticipantAbstractModel[];
	localParticipantSubs!: Subscription;
	remoteParticipantsSubs!: Subscription;

	constructor(
		private httpClient: HttpClient,
		private participantService: ParticipantService
	) {}

	async ngOnInit() {
		this.subscribeToParticipants();
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken()
		};
	}

	ngOnDestroy() {
		this.localParticipantSubs.unsubscribe();
		this.remoteParticipantsSubs.unsubscribe();
	}

	subscribeToParticipants() {
		this.localParticipantSubs = this.participantService.localParticipantObs.subscribe((p) => {
			this.localParticipant = p;
		});

		this.remoteParticipantsSubs = this.participantService.remoteParticipantsObs.subscribe((participants) => {
			this.remoteParticipants = participants;
		});
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


