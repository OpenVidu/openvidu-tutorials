import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnDestroy } from '@angular/core';
import { StreamManager, StreamPropertyChangedEvent } from 'openvidu-browser';
import { Platform } from '@ionic/angular';
declare var cordova;

@Component({
    selector: 'ov-video',
    template: '<video #videoElement style="width: 100%"></video>'
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
                setTimeout(() => {
                    this.applyIosIonicVideoAttributes();
                }, 250);
            };
            (<any>window).addEventListener('orientationchange', this.rotationFunction);
        }
        this.updateVideoView();
    }

    ngOnDestroy() {
        if (!!this.rotationFunction) {
            (<any>window).removeEventListener('orientationchange', this.rotationFunction);
        }
    }

    @Input()
    set streamManager(streamManager: StreamManager) {
        this._streamManager = streamManager;
        if (this.isIos()) {
            this._streamManager.on('streamPropertyChanged', event => {
                if ((<StreamPropertyChangedEvent>event).changedProperty === 'videoDimensions') {
                    this.applyIosIonicVideoAttributes();
                }
            });
        }
    }

    private updateVideoView() {
        this._streamManager.addVideoElement(this.elementRef.nativeElement);
        if (this.isIos()) {
            (<HTMLVideoElement>this.elementRef.nativeElement).onloadedmetadata = () => {
                this.applyIosIonicVideoAttributes();
            };
        }
    }

    private applyIosIonicVideoAttributes() {
        const ratio = this._streamManager.stream.videoDimensions.height / this._streamManager.stream.videoDimensions.width;
        this.elementRef.nativeElement.style.width = '100% !important';
        this.elementRef.nativeElement.style.objectFit = 'fill';
        this.elementRef.nativeElement.style.zIndex = '-1';
        const computedWidth = this.elementRef.nativeElement.offsetWidth;
        this.elementRef.nativeElement.style.height = computedWidth * ratio + 'px';
        if (!this._streamManager.remote) {
            // It is a Publisher video. Custom iosrtc plugin mirror video
            this.elementRef.nativeElement.style.transform = 'scaleX(-1)';
        }
        cordova.plugins.iosrtc.refreshVideos();
    }

    private isIos(): boolean {
        return this.platform.is('ios') && this.platform.is('cordova');
    }
}
