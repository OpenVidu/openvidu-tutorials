import { Component, Input, DoCheck } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { Stream } from 'openvidu-browser';

@Component({
    selector: 'stream-component',
    styles: [`
        video {
            width: 100%;
            height: auto;
        }`],
    template: `
        <div>
          <video autoplay="true" [src]="videoSrc"></video>
          <p>{{this.getNicknameTag()}}</p>
        </div>`
})
export class StreamComponent implements DoCheck {

    @Input()
    stream: Stream;

    videoSrc: SafeUrl = '';
    videSrcUnsafe = '';

    constructor(private sanitizer: DomSanitizer) { }

    ngDoCheck() {
        if (!(this.videSrcUnsafe === this.stream.getVideoSrc())) {
            // src of Stream object has changed
            this.videoSrc = this.sanitizer.bypassSecurityTrustUrl(this.stream.getVideoSrc());
            this.videSrcUnsafe = this.stream.getVideoSrc();
        }
    }

    getNicknameTag() {
        return 'Nickname: ' + JSON.parse(this.stream.connection.data).clientData;
    }

}
