import { Component } from "@angular/core";
import { catchError, throwError as observableThrowError } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { TokenModel, Signal } from "openvidu-angular";
import { Session, SignalOptions } from "openvidu-browser";

@Component({
	selector: "app-root",
	template: `
		<ov-videoconference
			(onSessionCreated)="onSessionCreated($event)"
			[tokens]="tokens"
			[toolbarDisplaySessionName]="false"
		>
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
	styles: [
		`
			#my-panel {
				background: #aafffc;
				height: 100%;
				overflow: hidden;
				text-align: center;
			}
		`,
	],
})
export class AppComponent implements OnInit{
	title = "openvidu-custom-chat-panel";
	tokens!: TokenModel;
	sessionId = "chat-panel-directive-example";
	OPENVIDU_SERVER_URL = "https://localhost:4443";
	OPENVIDU_SERVER_SECRET = "MY_SECRET";
	session!: Session;
	messages: string[] = [];
	constructor(private httpClient: HttpClient) {}

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
					Authorization:
						"Basic " + btoa("OPENVIDUAPP:" + this.OPENVIDU_SERVER_SECRET),
					"Content-Type": "application/json",
				}),
			};
			return this.httpClient
				.post(
					this.OPENVIDU_SERVER_URL + "/openvidu/api/sessions",
					body,
					options
				)
				.pipe(
					catchError((error) => {
						if (error.status === 409) {
							resolve(sessionId);
						} else {
							console.warn(
								"No connection to OpenVidu Server. This may be a certificate error at " +
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
									this.OPENVIDU_SERVER_URL + "/accept-certificate"
								);
							}
						}
						return observableThrowError(error);
					})
				)
				.subscribe((response: any) => {
					console.log(response);
					resolve(response["id"]);
				});
		});
	}

	createToken(sessionId: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const body = {};
			const options = {
				headers: new HttpHeaders({
					Authorization:
						"Basic " + btoa("OPENVIDUAPP:" + this.OPENVIDU_SERVER_SECRET),
					"Content-Type": "application/json",
				}),
			};
			return this.httpClient
				.post(
					this.OPENVIDU_SERVER_URL +
						"/openvidu/api/sessions/" +
						sessionId +
						"/connection",
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
					resolve(response["token"]);
				});
		});
	}
}
