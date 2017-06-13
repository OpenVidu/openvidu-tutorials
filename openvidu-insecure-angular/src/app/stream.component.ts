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
        return 'Nickname: ' + JSON.parse(this.stream.connection.data).clientData;
    }

}
