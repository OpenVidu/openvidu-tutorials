import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { catchError, throwError as observableThrowError } from 'rxjs';
import { ParticipantService, OpenViduService } from 'openvidu-angular';
import { ParticipantAppModel } from './models/participant-app.model';

import { Session, SignalOptions } from 'openvidu-browser';

enum SignalApp {
	HAND_TOGGLE = 'handToggle'
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	animations: [
		trigger('inOutHandAnimation', [
			transition(':enter', [
				style({ opacity: 0, transform: 'translateY(-100%)' }),
				animate('300ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
			]),
			transition(':leave', [
				style({ opacity: 1, transform: 'translateY(0)' }),
				animate('300ms ease-in-out', style({ opacity: 0, transform: 'translateY(-100%)' }))
			])
		])
	]
})
export class AppComponent implements OnInit{
	tokens: { webcam: string; screen: string };
	hasHandRaised: boolean = false;
	session: Session;
	private sessionId = 'openvidu-toggle-hand';
	private OPENVIDU_SERVER_URL = 'https://' + location.hostname + ':4443';
	private OPENVIDU_SERVER_SECRET = 'MY_SECRET';

	constructor(private httpClient: HttpClient, private openviduService: OpenViduService, private participantService: ParticipantService) {

	}
	async ngOnInit() {
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken()
		};
	}

	async onJoinButtonClicked() {
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken()
		};

	}

	onSessionCreated(session: Session){
		this.session = session;
		this.handleRemoteHand();
	}

	handleRemoteHand() {
		// Subscribe to hand toggling events from others
		this.session.on(`signal:${SignalApp.HAND_TOGGLE}`, (event: any) => {
			const connectionId = event.from.connectionId;
			const participant = <ParticipantAppModel>this.participantService.getRemoteParticipantByConnectionId(connectionId);
			if (participant) {
				participant.toggleHandRaised();
				this.participantService.updateRemoteParticipants();
			}
		});
	}

	handleLocalHand() {
		this.hasHandRaised = !this.hasHandRaised;
		const participant = <ParticipantAppModel>this.participantService.getLocalParticipant();
		participant.toggleHandRaised();
		this.participantService.updateLocalParticipant();
		const remoteConnections = this.openviduService.getRemoteConnections();
		if (remoteConnections.length > 0) {
			//Sending hand toggle signal to others
			const signalOptions: SignalOptions = {
				type: SignalApp.HAND_TOGGLE,
				to: remoteConnections
			};
			this.session.signal(signalOptions);
		}
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
		return this.createSession(this.sessionId).then((sessionId) => {
			return this.createToken(sessionId);
		});
	}

	createSession(sessionId) {
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
				.subscribe((response) => {
					console.log(response);
					resolve(response['id']);
				});
		});
	}

	createToken(sessionId): Promise<string> {
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
				.subscribe((response) => {
					console.log(response);
					resolve(response['token']);
				});
		});
	}
}
