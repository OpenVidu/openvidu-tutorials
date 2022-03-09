import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ParticipantService } from 'openvidu-angular';

import { RestService } from '../../services/rest.service';


@Component({
	selector: 'app-call',
	templateUrl: './call.component.html',
	styleUrls: ['./call.component.css']
})
export class CallComponent implements OnInit {
	sessionId = '';
	tokens: { webcam: string; screen: string };

	joinSessionClicked: boolean = false;
	closeClicked: boolean = false;
	isSessionAlive: boolean = false;

	constructor(private restService: RestService, private participantService: ParticipantService, private router: Router, private route: ActivatedRoute) {}

	ngOnInit() {
		this.route.params.subscribe((params: Params) => {
			this.sessionId = params.roomName;
		});
	}

	async onJoinButtonClicked() {
		let nickname;
		const regex = /^UNSAFE_DEBUG_USE_CUSTOM_IDS_/gm;
		const match = regex.exec(this.sessionId);
		if(match && match.length > 0){
			console.warn('DEBUGGING SESSION');
			nickname = this.participantService.getLocalParticipant().getNickname();
		}

		this.tokens = {
			webcam: await this.restService.getToken(this.sessionId, nickname),
			screen: await this.restService.getToken(this.sessionId, nickname)
		};
	}
	onLeaveButtonClicked() {
		this.isSessionAlive = false;
		this.closeClicked = true;
		this.router.navigate([`/`]);
	}
}
