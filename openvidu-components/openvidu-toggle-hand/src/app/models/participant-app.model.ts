import { ParticipantAbstractModel } from 'openvidu-angular';

export class ParticipantAppModel extends ParticipantAbstractModel {

	hasHandRaised: boolean;

	toggleHandRaised() {
		this.hasHandRaised = !this.hasHandRaised;
	}

}