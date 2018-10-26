import { Component, Input } from '@angular/core';
import { StreamManager } from 'openvidu-browser';


@Component({
    selector: 'user-video',
    styles: [
        `
            ov-video {
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
            p {
                margin: 0;
            }
        `,
    ],
    template: `
        <div>
            <ov-video [streamManager]="streamManager"></ov-video>
            <div><p>{{getNicknameTag()}}</p></div>
        </div>`,
})
export class UserVideoComponent {

    @Input()
    streamManager: StreamManager;

    getNicknameTag() {
        try {
            return JSON.parse(this.streamManager.stream.connection.data).clientData;
        } catch (err) {
            console.error('ClientData is not JSON formatted');
        }
    }
}
