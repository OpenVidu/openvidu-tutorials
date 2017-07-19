import { Component, Input, Output, DoCheck, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { Stream } from 'openvidu-browser';

@Component({
    selector: 'stream-component',
    styles: [`
        video {
            width: 100%;
            height: auto;
            float: left;
            cursor: pointer;
        }
        div div {
            position: absolute;
            background: #f8f8f8;
            padding-left: 5px;
            padding-right: 5px;
            color: #777777;
            font-weight: bold;
            border-bottom-right-radius: 4px;
        }
        p{
            margin: 0;
        }`],
    template: `
        <div>
          <video autoplay="true" [src]="videoSrc" [id]="'native-video-' + this.stream.connection.connectionId + '_webcam'"
            (click)="this.videoClicked()"></video>
          <div [id]="'data-' + this.stream.connection.connectionId"><p>{{this.getNicknameTag()}}</p></div>
        </div>`
})
export class StreamComponent implements DoCheck {

    @Input()
    stream: Stream;

    @Output()
    mainVideoStream = new EventEmitter();

    videoSrc: SafeUrl = '';
    videSrcUnsafe = '';

    constructor(private sanitizer: DomSanitizer) { }

    ngDoCheck() { // Detect any change in 'stream' property
        // If 'src' of Stream object has changed, 'videoSrc' value must be updated
        if (!(this.videSrcUnsafe === this.stream.getVideoSrc())) {
            // Angular mandatory URL sanitization
            this.videoSrc = this.sanitizer.bypassSecurityTrustUrl(this.stream.getVideoSrc());
            // Auxiliary value to store the URL as a string for upcoming comparisons
            this.videSrcUnsafe = this.stream.getVideoSrc();
        }
    }

    getNicknameTag() {
        return JSON.parse(this.stream.connection.data).clientData;
    }

    videoClicked() {
        this.mainVideoStream.next(this.stream);
    }

}
