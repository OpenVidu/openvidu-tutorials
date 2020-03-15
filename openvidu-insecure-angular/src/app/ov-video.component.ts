import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StreamManager } from 'openvidu-browser';

@Component({
    selector: 'ov-video',
    template: '<video #videoElement></video>'
})
export class OpenViduVideoComponent implements AfterViewInit {

    @ViewChild('videoElement') elementRef: ElementRef;

    _streamManager: StreamManager;

    ngAfterViewInit() {
        this._streamManager.addVideoElement(this.elementRef.nativeElement);
    }

    @Input()
    set streamManager(streamManager: StreamManager) {
        this._streamManager = streamManager;
        if (!!this.elementRef) {
            this._streamManager.addVideoElement(this.elementRef.nativeElement);
        }
    }

}
