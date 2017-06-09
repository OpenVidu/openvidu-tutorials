import { OpenVidu, Session, Subscriber, Publisher, Stream } from 'openvidu-browser';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  private OV: OpenVidu;
  private session: Session;

  toggle = false;
  subscriber: Subscriber;
  publisher: Publisher;
  stream: Stream;

  // Join form
  sessionId: string;
  token: string;

  constructor() {
    this.generateParticipantInfo();
  }

  private generateParticipantInfo() {
    this.sessionId = 'SessionA';
    this.token = 'Participant' + Math.floor(Math.random() * 100);
  }

  joinSession() {
    this.sessionId = (<HTMLInputElement>document.getElementById('sessionId')).value;
    this.token = (<HTMLInputElement>document.getElementById('token')).value;

    this.OV = new OpenVidu('wss://' + location.hostname + ':8443/');
    this.session = this.OV.initSession('apikey', this.sessionId);

    // 2) Specify the actions when events take place
    this.session.on('streamCreated', (event) => {
      this.stream = event.stream;
      this.subscriber = this.session.subscribe(event.stream, 'subscriber', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      });
      this.subscriber.on('videoElementCreated', (e) => {
        console.warn('VIDEO ELEMENT HAS BEEN CREATED BY SUBSCRIBER!');
        console.warn(e);
      });

    });

     this.session.on('streamDestroyed', (event) => {
        console.warn('Stream has been destroyed!');
        //event.preventDefault(); // Do not remove the HTML video element
     });

    // 3) Connect to the session
    this.session.connect(this.token, (error) => {
      // If the connection is successful, initialize a publisher and publish to the session
      if (!error) {

        // 4) Get your own camera stream with the desired resolution and publish it, only if the user is supposed to do so
        this.publisher = this.OV.initPublisher('publisher', {
          insertMode: 'append',
          width: '100%',
          height: '100%'
        });

        this.publisher.on('videoElementCreated', (event) => {
          console.warn('VIDEO ELEMENT HAS BEEN CREATED BY PUBLISHER!');
          console.warn(event);
        });

        // 5) Publish your stream
        this.session.publish(this.publisher);

      } else {
        console.log('There was an error connecting to the session:', error.code, error.message);
      }
    });

    return false;
  }

  leaveSession() {
    if (this.OV) { this.session.disconnect(); };
    this.session = null;
    this.OV = null;
    this.generateParticipantInfo();
  }

  testingAction() {
    // UNSUBSCRIBE-SUBSCRIBE
    /*if (!this.toggle) {
      this.session.unsubscribe(this.subscriber);
    } else {
      this.subscriber = this.session.subscribe(this.stream, 'subscriber');
      this.subscriber.on('videoElementCreated', (e) => {
        console.warn('VIDEO ELEMENT HAS BEEN CREATED BY SUBSCRIBER!');
        console.warn(e);
      });
    }
    this.toggle = !this.toggle;*/

    // PUBLISHER.DESTROY
    /*this.publisher.destroy();*/
  }

}
