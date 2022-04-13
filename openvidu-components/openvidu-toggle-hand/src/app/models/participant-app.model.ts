import { StreamModel, ParticipantAbstractModel } from 'openvidu-angular';
export class ParticipantAppModel extends ParticipantAbstractModel {

	hasHandRaised: boolean;

	// constructor(model?:StreamModel, id?: string) {
	// 	super(model, id);
	// }

	toggleHandRaised() {
		this.hasHandRaised = !this.hasHandRaised;
	}
}
