/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @angular-eslint/component-selector */
import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnDestroy } from '@angular/core';
import { StreamManager, StreamPropertyChangedEvent } from 'openvidu-browser';
import { Platform } from '@ionic/angular';
declare let cordova;

@Component({
	selector: 'ov-video',
	template: '<video #videoElement style="width: 100%; background: transparent"></video>'
})
export class OpenViduVideoComponent implements AfterViewInit, OnDestroy {
	@ViewChild('videoElement') elementRef: ElementRef;
	_streamManager: StreamManager;

	rotationFunction;

	constructor(private platform: Platform) {}

	ngAfterViewInit() {
		if (this.isIos() && this._streamManager.remote) {
			this.rotationFunction = () => {
				// Give the remote video some time to update its dimensions when rotating the device
				this.applyIosAttributes();
			};
			window.addEventListener('orientationchange', this.rotationFunction);
			this.applyIosAttributes();
		}
		this.updateVideoView();
	}

	ngOnDestroy() {
		if (!!this.rotationFunction) {
			window.removeEventListener('orientationchange', this.rotationFunction);
		}
	}

	@Input()
	set streamManager(streamManager: StreamManager) {
		this._streamManager = streamManager;
		if (this.isIos()) {
			this._streamManager.on('streamPropertyChanged', (event: StreamPropertyChangedEvent) => {
				if (event.changedProperty === 'videoDimensions') {
					this.applyIosIonicVideoAttributes();
				}
			});
		}
	}

	private updateVideoView() {
		this._streamManager.addVideoElement(this.elementRef.nativeElement);
		if (this.isIos()) {
			this.elementRef.nativeElement.onloadedmetadata = () => {
				this.applyIosIonicVideoAttributes();
			};
		}
	}

	private applyIosIonicVideoAttributes() {
		const ratio = this._streamManager.stream.videoDimensions.height / this._streamManager.stream.videoDimensions.width;
		this.elementRef.nativeElement.style.width = '100% !important';
		this.elementRef.nativeElement.style.objectFit = 'fill';
		this.elementRef.nativeElement.style.zIndex = '0';
		const computedWidth = this.elementRef.nativeElement.offsetWidth;
		this.elementRef.nativeElement.style.height = computedWidth * ratio + 'px';
		if (!this._streamManager.remote) {
			// It is a Publisher video. Custom iosrtc plugin mirror video
			this.elementRef.nativeElement.style.transform = 'scaleX(-1)';
		}
		cordova.plugins.iosrtc.refreshVideos();
	}

	private isIos(): boolean {
		return this.platform.is('ios') && this.platform.is('capacitor');
	}

	private applyIosAttributes() {
		setTimeout(() => {
			this.applyIosIonicVideoAttributes();
		}, 250);
	}
}
