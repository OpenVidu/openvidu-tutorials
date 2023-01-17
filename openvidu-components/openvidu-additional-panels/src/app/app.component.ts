import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { PanelService, PanelType, TokenModel } from "openvidu-angular";
import { environment } from 'src/environments/environment';

@Component({
	selector: "app-root",
	template: `
		<ov-videoconference [tokens]="tokens" [toolbarDisplaySessionName]="false">
			<div *ovToolbarAdditionalPanelButtons style="text-align: center;">
				<button mat-icon-button (click)="toggleMyPanel('my-panel')">
					<mat-icon>360</mat-icon>
				</button>
				<button mat-icon-button (click)="toggleMyPanel('my-panel2')">
					<mat-icon>star</mat-icon>
				</button>
			</div>
			<div *ovAdditionalPanels id="my-panels">
				<div id="my-panel1" *ngIf="showExternalPanel">
					<h2>NEW PANEL</h2>
					<p>This is my new additional panel</p>
				</div>
				<div id="my-panel2" *ngIf="showExternalPanel2">
					<h2>NEW PANEL 2</h2>
					<p>This is other new panel</p>
				</div>
			</div>
		</ov-videoconference>
	`,
	styles: [`
			#my-panels {
				height: 100%;
				overflow: hidden;
			}
			#my-panel1,
			#my-panel2 {
				text-align: center;
				height: calc(100% - 40px);
				margin: 20px;
			}
			#my-panel1 {
				background: #c9ffb2;
			}
			#my-panel2 {
				background: #ddf2ff;
			}
		`]
})
export class AppComponent {

	APPLICATION_SERVER_URL = environment.applicationServerUrl;

	sessionId = "toolbar-additionalbtn-directive-example";
	tokens!: TokenModel;

	showExternalPanel: boolean = false;
	showExternalPanel2: boolean = false;

	constructor(
		private httpClient: HttpClient,
		private panelService: PanelService
	) { }

	async ngOnInit() {
		this.subscribeToPanelToggling();
		this.tokens = {
			webcam: await this.getToken(),
			screen: await this.getToken(),
		};
	}

	subscribeToPanelToggling() {
		this.panelService.panelOpenedObs.subscribe(
			(ev: { opened: boolean; type?: PanelType | string }) => {
				this.showExternalPanel = ev.opened && ev.type === "my-panel";
				this.showExternalPanel2 = ev.opened && ev.type === "my-panel2";
			}
		);
	}

	toggleMyPanel(type: string) {
		this.panelService.togglePanel(type);
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