import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StreamManager, StreamPropertyChangedEvent } from 'openvidu-browser';
import { Platform } from '@ionic/angular';
declare var cordova;

@Component({
    selector: 'ov-video',
    template: '<video #videoElement></video>',
    styles: [
        `
            video {
                z-index: -1;
            }
        `
    ]
})
export class OpenViduVideoComponent implements AfterViewInit {

    @ViewChild('videoElement') elementRef: ElementRef;
    _streamManager: StreamManager;

    constructor(private platform: Platform) {}

    ngAfterViewInit() {
        this.updateVideoView();
    }

    @Input()
    set streamManager(streamManager: StreamManager) {
        this._streamManager = streamManager;
        if (this.isIos()) {
            this._streamManager.on('streamPropertyChanged', event => {
                let e: StreamPropertyChangedEvent = <StreamPropertyChangedEvent>event;
                if (e.changedProperty === 'videoDimensions') {
                    this.applyIosIonicVideoAttributes();
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
        this.elementRef.nativeElement.style.width = '100%';
        const computedWidth = this.elementRef.nativeElement.offsetWidth;
        console.warn(this._streamManager.stream.connection.data + ' - ' + computedWidth);
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
