/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @angular-eslint/component-selector */
import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StreamManager } from 'openvidu-browser';

@Component({
	selector: 'ov-video',
	template: '<video #videoElement style="width: 100%"></video>'
})
export class OpenViduVideoComponent implements AfterViewInit {

	@ViewChild('videoElement') elementRef: ElementRef;

	_streamManager: StreamManager;

	constructor() { }

	ngAfterViewInit() {
		this.updateVideoView();
	}

	@Input()
	set streamManager(streamManager: StreamManager) {
		this._streamManager = streamManager;
		if (!!this.elementRef) {
			this.updateVideoView();
		}
	}

	private updateVideoView() {
		this._streamManager.addVideoElement(this.elementRef.nativeElement);
	}
}
