import { Component, Input, Output, AfterViewInit, DoCheck, EventEmitter, ViewChild, ElementRef } from '@angular/core';

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
          <video #videoElement [id]="'native-video-' + this.stream.connection.connectionId + '_webcam'"
            (click)="this.videoClicked()" autoplay="true" [muted]="this.isMuted"></video>
          <div [id]="'data-' + this.stream.connection.connectionId"><p>{{this.getNicknameTag()}}</p></div>
        </div>`
})
export class StreamComponent implements AfterViewInit, DoCheck {

    @ViewChild('videoElement') elementRef: ElementRef;

    videoElement: HTMLVideoElement;

    @Input()
    stream: Stream;

    @Input()
    isMuted: boolean;

    @Output()
    mainVideoStream = new EventEmitter();

    constructor() { }

    ngAfterViewInit() { // Get HTMLVideoElement from the view
        this.videoElement = this.elementRef.nativeElement;
    }

    ngDoCheck() { // Detect any change in 'stream' property (specifically in its 'srcObject' property)
        if (this.videoElement && (this.videoElement.srcObject !== this.stream.getMediaStream())) {
            this.videoElement.srcObject = this.stream.getMediaStream();
        }
    }

    getNicknameTag() { // Gets the nickName of the user
        return JSON.parse(this.stream.connection.data).clientData;
    }

    videoClicked() { // Triggers event for the parent component to update its view
        this.mainVideoStream.next(this.stream);
    }

}
