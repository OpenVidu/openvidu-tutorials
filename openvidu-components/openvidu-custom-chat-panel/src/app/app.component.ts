import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { Signal, TokenModel } from "openvidu-angular";
import { Session, SignalOptions } from "openvidu-browser";
import { environment } from 'src/environments/environment';

@Component({
	selector: "app-root",
	template: `
		<ov-videoconference
			(onSessionCreated)="onSessionCreated($event)"
			[tokens]="tokens"
			[toolbarDisplaySessionName]="false">
			<div *ovChatPanel id="my-panel">
				<h3>Chat</h3>
				<div>
					<ul>
						<li *ngFor="let msg of messages">{{ msg }}</li>
					</ul>
				</div>
				<input value="Hello" #input />
				<button (click)="send(input.value)">Send</button>
			</div>
		</ov-videoconference>
	`,
	styles: [`
			#my-panel {
				background: #aafffc;
				height: 100%;
				overflow: hidden;
				text-align: center;
			}
		`]
})
export class AppComponent implements OnInit {

	APPLICATION_SERVER_URL = environment.applicationServerUrl;

	sessionId = "chat-panel-directive-example";
	tokens!: TokenModel;

	session!: Session;
	messages: string[] = [];

	constructor(private httpClient: HttpClient) { }

	async ngOnInit() {
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken(),
		};
	}

	onSessionCreated(session: Session) {
		this.session = session;
		this.session.on(`signal:${Signal.CHAT}`, (event: any) => {
			const msg = JSON.parse(event.data).message;
			this.messages.push(msg);
		});
	}

	send(message: string): void {
		const signalOptions: SignalOptions = {
			data: JSON.stringify({ message }),
			type: Signal.CHAT,
			to: undefined,
		};
		this.session.signal(signalOptions);
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