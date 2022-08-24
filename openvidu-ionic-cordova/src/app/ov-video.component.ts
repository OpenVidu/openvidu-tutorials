import {
	AfterViewInit,
	Component,
	ElementRef,
	Input,
	ViewChild,
} from "@angular/core";
import { StreamManager } from "openvidu-browser";

@Component({
	selector: "ov-video",
	template: '<video #videoElement style="width: 100%"></video>',
})
export class OpenViduVideoComponent implements AfterViewInit {

	@ViewChild("videoElement") elementRef: ElementRef;
	_streamManager: StreamManager;

	constructor() { }

	ngAfterViewInit() {
		this.updateVideoView();
	}

	@Input()
	set streamManager(streamManager: StreamManager) {
		this._streamManager = streamManager;
		this.updateVideoView();
	}

	private updateVideoView() {
		if (!!this.elementRef) {
			this._streamManager.addVideoElement(this.elementRef.nativeElement);
		}
	}
}
