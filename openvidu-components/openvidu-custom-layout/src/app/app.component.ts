import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { lastValueFrom, Subscription } from "rxjs";

import { ParticipantAbstractModel, ParticipantService, TokenModel } from "openvidu-angular";
import { environment } from 'src/environments/environment';

@Component({
	selector: "app-root",
	template: `
		<ov-videoconference	[tokens]="tokens" (onSessionCreated)="subscribeToParticipants()">
			<div *ovLayout>
				<div class="container">
					<div class="item" *ngFor="let stream of localParticipant | streams">
						<ov-stream [stream]="stream"></ov-stream>
					</div>
					<div class="item" *ngFor="let stream of remoteParticipants | streams">
						<ov-stream [stream]="stream"></ov-stream>
					</div>
				</div>
			</div>
		</ov-videoconference>
	`,
	styles: [`
			.container {
				display: flex;
				flex-wrap: wrap;
				justify-content: space-between;
			}
			.item {
				flex: 0 50%;
				height: 250px;
				margin-bottom: 2%;
			}
		`]
})
export class AppComponent implements OnInit {

	APPLICATION_SERVER_URL = environment.applicationServerUrl;

	sessionId = 'layout-directive-example';
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