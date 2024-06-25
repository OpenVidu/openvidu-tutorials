import { ParticipantModel, ParticipantProperties } from 'openvidu-components-angular';

// Represents a participant in the application, with the ability to raise their hand.
export class ParticipantAppModel extends ParticipantModel {

	// Indicates whether the participant has raised their hand.
	hasHandRaised: boolean;

	//  Creates a new instance of ParticipantAppModel.
	constructor(props: ParticipantProperties) {
		super(props);
		this.hasHandRaised = false;
	}

	// Toggles the participant's hand raised status.
	toggleHandRaised() {
		this.hasHandRaised = !this.hasHandRaised;
	}
}