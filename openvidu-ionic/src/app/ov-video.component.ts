import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnDestroy } from '@angular/core';
import { StreamManager, StreamPropertyChangedEvent } from 'openvidu-browser';
import { Platform } from '@ionic/angular';
declare var cordova;

@Component({
    selector: 'ov-video',
    template: '<video #videoElement></video>',
    styles: [
        `
            video {
                width: inherit;
            }
        `
    ]
})
export class OpenViduVideoComponent implements AfterViewInit, OnDestroy {

    @ViewChild('videoElement') elementRef: ElementRef;
    _streamManager: StreamManager;

    rotationFunction;

    constructor(private platform: Platform) {}

    ngAfterViewInit() {window.addEventListener
        if (this.isIos() && this._streamManager.remote) {
            this.rotationFunction = () => {
                // Give the remote video some time to update its dimensions when rotating the device
                setTimeout(() => {
                    this.applyIosIonicVideoAttributes();
                    cordova.plugins.iosrtc.refreshVideos();
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
                let e: StreamPropertyChangedEvent = <StreamPropertyChangedEvent>event;
                if (e.changedProperty === 'videoDimensions') {
                    this.applyIosIonicVideoAttributes();
                    cordova.plugins.iosrtc.refreshVideos();
                }
            });
        }
    }

    private updateVideoView() {
        if (this.isIos()) {
            (<HTMLVideoElement>this.elementRef.nativeElement).onloadedmetadata = () => {
                this.applyIosIonicVideoAttributes();
            };
        }
        this._streamManager.addVideoElement(this.elementRef.nativeElement);
        if (this.isIos()) {
            cordova.plugins.iosrtc.refreshVideos();
        }
    }

    private applyIosIonicVideoAttributes() {
        let ratio = this._streamManager.stream.videoDimensions.height / this._streamManager.stream.videoDimensions.width;
        this.elementRef.nativeElement.style.width = '100% !important';
        this.elementRef.nativeElement.style.objectFit = 'fill';
        this.elementRef.nativeElement.style.zIndex = '-1';
        const computedWidth = this.elementRef.nativeElement.offsetWidth;
        this.elementRef.nativeElement.style.height = computedWidth * ratio + 'px';
        if (!this._streamManager.remote) {
            // It is a Publisher video. Custom iosrtc plugin mirror video
            this.elementRef.nativeElement.style.transform = 'scaleX(-1)';
        }
    }

    private isIos(): boolean {
        return this.platform.is('ios') && this.platform.is('cordova');
    }
}
