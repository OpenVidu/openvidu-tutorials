import { OpenVidu, Session, Stream } from 'openvidu-browser';
import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  // OpenVidu objects
  OV: OpenVidu;
  session: Session;

  // Streams to feed StreamComponent's
  remoteStreams: Stream[] = [];
  localStream: Stream;

  // Join form
  sessionId: string;
  token: string;

  // Main video of the page, will be 'localStream' or one of the 'remoteStreams',
  // updated by an Output event of StreamComponent children
  @Input() mainVideoStream: Stream;

  constructor() {
    this.generateParticipantInfo();
  }

  @HostListener('window:beforeunload')
  beforeunloadHandler() {
    // On window closed leave session
    this.leaveSession();
  }

  ngOnDestroy() {
    // On component destroyed leave session
    this.leaveSession();
  }

  joinSession() {

    // --- 1) Get an OpenVidu object and init a session with a sessionId ---

    // Init OpenVidu object
    this.OV = new OpenVidu();

    // We will join the video-call "sessionId". This parameter must start with the URL of OpenVidu Server
    this.session = this.OV.initSession('wss://' + location.hostname + ':8443/' + this.sessionId);


    // --- 2) Specify the actions when events take place ---

    // On every new Stream received...
    this.session.on('streamCreated', (event) => {

      // Add the new stream to 'remoteStreams' array
      this.remoteStreams.push(event.stream);

      // Subscribe to the Stream to receive it. Second parameter is an empty string
      // so OpenVidu doesn't create an HTML video by its own
      this.session.subscribe(event.stream, '');
    });

    // On every Stream destroyed...
    this.session.on('streamDestroyed', (event) => {

      // Avoid OpenVidu trying to remove the HTML video element
      event.preventDefault();

      // Remove the stream from 'remoteStreams' array
      this.deleteRemoteStream(event.stream);
    });


    // --- 3) Connect to the session ---

    // 'token' param irrelevant when using insecure version of OpenVidu. Second param will be received by every user
    // in Stream.connection.data property, which will be appended to DOM as the user's nickname
    this.session.connect(this.token, '{"clientData": "' + this.token + '"}', (error) => {

     // If connection successful, initialize a publisher and publish to the session
      if (!error) {

        // --- 4) Get your own camera stream with the desired resolution ---

        // Both audio and video will be active. Second parameter is an empty string
        // so OpenVidu doesn't create an HTML video by its own
        let publisher = this.OV.initPublisher('', {
          audio: true,
          video: true,
          quality: 'MEDIUM'
        });

        // Store your webcam stream in 'localStream' object
        this.localStream = publisher.stream;
        // Set the main video in the page to display our webcam
        this.mainVideoStream = this.localStream;


        // --- 5) Publish your stream ---

        this.session.publish(publisher);

      } else {
        console.log('There was an error connecting to the session:', error.code, error.message);
      }
    });

    return false;
  }

  leaveSession() {
    // --- 6) Leave the session by calling 'disconnect' method over the Session object ---
    if (this.OV) { this.session.disconnect(); };

    // Empty all properties...
    this.remoteStreams = [];
    this.localStream = null;
    this.session = null;
    this.OV = null;
    this.generateParticipantInfo();
  }


  private generateParticipantInfo() {
    // Random user nickname and sessionId
    this.sessionId = 'SessionA';
    this.token = 'Participant' + Math.floor(Math.random() * 100);
  }

  private deleteRemoteStream(stream: Stream): void {
    let index = this.remoteStreams.indexOf(stream, 0);
    if (index > -1) {
      this.remoteStreams.splice(index, 1);
    }
  }

  private getMainVideoStream(stream: Stream) {
    this.mainVideoStream = stream;
  }

}
