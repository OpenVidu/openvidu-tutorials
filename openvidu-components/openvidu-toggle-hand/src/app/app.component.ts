import { animate, style, transition, trigger } from "@angular/animations";
import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { OpenViduService, ParticipantService } from "openvidu-angular";
import { ParticipantAppModel } from "./models/participant-app.model";

import { Session, SignalOptions } from "openvidu-browser";
import { environment } from 'src/environments/environment';

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
export class AppComponent implements OnInit {

	APPLICATION_SERVER_URL = environment.applicationServerUrl;

	tokens: { webcam: string; screen: string };
	hasHandRaised: boolean = false;
	session: Session;
	private sessionId = 'openvidu-toggle-hand';

	constructor(private httpClient: HttpClient, private openviduService: OpenViduService, private participantService: ParticipantService) { }
	async ngOnInit() {
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken()
		};
	}

	onSessionCreated(session: Session) {
		this.session = session;
		this.handleRemoteHand();
	}

	handleRemoteHand() {
		// Subscribe to hand toggling events from other participants
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
		// Get local participant with ParticipantService
		const participant = <ParticipantAppModel>this.participantService.getLocalParticipant();

		// Toggle the participant hand with the method we wil add in our ParticipantAppModel
		participant.toggleHandRaised();

		// Refresh the local participant object for others component and services
		this.participantService.updateLocalParticipant();

		// Send a signal with the new value to others participant using the openvidu-browser signal
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
	 * --------------------------------------------
	 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
	 * --------------------------------------------
	 * The methods below request the creation of a Session and a Token to
	 * your application server. This keeps your OpenVidu deployment secure.
	 *
	 * In this sample code, there is no user control at all. Anybody could
	 * access your application server endpoints! In a real production
	 * environment, your application server must identify the user to allow
	 * access to the endpoints.
	 *
	 * Visit https://docs.openvidu.io/en/stable/application-server to learn
	 * more about the integration of OpenVidu in your application server.
	 */

	async getToken(): Promise<string> {
		const sessionId = await this.createSession(this.sessionId);
		return await this.createToken(sessionId);
	}

	createSession(sessionId: string): Promise<string> {
		return lastValueFrom(this.httpClient.post(
			this.APPLICATION_SERVER_URL + 'api/sessions',
			{ customSessionId: sessionId },
			{ headers: { 'Content-Type': 'application/json' }, responseType: 'text' }
		));
	}

	createToken(sessionId: string): Promise<string> {
		return lastValueFrom(this.httpClient.post(
			this.APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
			{},
			{ headers: { 'Content-Type': 'application/json' }, responseType: 'text' }
		));
	}
}