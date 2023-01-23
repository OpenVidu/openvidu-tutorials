import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { lastValueFrom, Subscription } from "rxjs";

import { ParticipantAbstractModel, ParticipantService, TokenModel } from "openvidu-angular";
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-root',
	template: `
		<ov-videoconference [tokens]="tokens" [toolbarDisplaySessionName]="false" (onSessionCreated)="subscribeToParticipants()">
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
	styles: [`
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
		`]
})
export class AppComponent implements OnInit {

	APPLICATION_SERVER_URL = environment.applicationServerUrl;

	sessionId = 'participants-panel-directive-example';
	tokens!: TokenModel;

	localParticipant!: ParticipantAbstractModel;
	remoteParticipants!: ParticipantAbstractModel[];
	localParticipantSubs!: Subscription;
	remoteParticipantsSubs!: Subscription;

	constructor(private httpClient: HttpClient, private participantService: ParticipantService) { }

	async ngOnInit() {
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