import { OpenVidu, Session, Stream, StreamEvent } from 'openvidu-browser';
import { Component, HostListener, Input, OnDestroy } from '@angular/core';

declare var $;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {

  // OpenVidu objects
  OV: OpenVidu;
  session: Session;

  // Streams to feed StreamComponent's
  remoteStreams: Stream[] = [];
  localStream: Stream;

  // Join form
  sessionId: string;
  userName: string;

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

    // --- 1) Get an OpenVidu object and init a session ---

    this.OV = new OpenVidu();
    this.session = this.OV.initSession();


    // --- 2) Specify the actions when events take place ---

    // On every new Stream received...
    this.session.on('streamCreated', (event: StreamEvent) => {

      // Add the new stream to 'remoteStreams' array
      this.remoteStreams.push(event.stream);

      // Subscribe to the Stream to receive it. Second parameter is undefined
      // so OpenVidu doesn't create an HTML video by its own
      this.session.subscribe(event.stream, undefined);
    });

    // On every Stream destroyed...
    this.session.on('streamDestroyed', (event: StreamEvent) => {

      // Avoid OpenVidu trying to remove the HTML video element
      event.preventDefault();

      // Remove the stream from 'remoteStreams' array
      this.deleteRemoteStream(event.stream);
    });


    // --- 3) Connect to the session with a valid user token ---

    // 'getToken' method is simulating what your server-side should do.
    // 'token' parameter should be retrieved and returned by your own backend
    this.getToken().then(token => {

      // First param is the token retrieved from OpenVidu Server. Second param will be received by every user
      // in Stream.connection.data property, which will be appended to DOM as the user's nickname
      this.session.connect(token, '{"clientData": "' + this.userName + '"}')
        .then(() => {

          // --- 4) Get your own camera stream ---

          // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
          // element: we will manage it ourselves) and with no properties (default ones)
          let publisher = this.OV.initPublisher(undefined);

          // Store your webcam stream in 'localStream' object
          this.localStream = publisher.stream;
          // Set the main video in the page to display our webcam
          this.mainVideoStream = this.localStream;

          // --- 5) Publish your stream ---

          this.session.publish(publisher);
        })
        .catch(error => {
          console.log('There was an error connecting to the session:', error.code, error.message);
        });
    });
  }

  leaveSession() {
    // --- 6) Leave the session by calling 'disconnect' method over the Session object ---
    if (this.session) { this.session.disconnect(); };

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
    this.userName = 'Participant' + Math.floor(Math.random() * 100);
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



  /**
   * --------------------------
   * SERVER-SIDE RESPONSABILITY
   * --------------------------
   * These methods retrieve the mandatory user token from OpenVidu Server.
   * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
   * the API REST, openvidu-java-client or openvidu-node-client):
   *   1) POST /api/sessions
   *   2) POST /api/tokens
   *   3) The value returned by /api/tokens must be consumed in Session.connect() method
   */

  private getToken() {
    return new Promise<string>(async (resolve) => {
      // POST /api/sessions
      await this.apiSessions();
      // POST /api/tokens
      let t = await this.apiTokens();
      // Return the user token
      resolve(<string>t);
    });
  }

  private apiSessions() {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'POST',
        url: 'https://' + location.hostname + ':4443/api/sessions',
        data: JSON.stringify({ customSessionId: this.sessionId }),
        headers: {
          'Authorization': 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
          'Content-Type': 'application/json'
        },
        success: (response) => {
          resolve(response.id)
        },
        error: (error) => {
          if (error.status === 409) {
            resolve(this.sessionId);
          } else {
            reject(error)
          }
        }
      });
    });
  }

  private apiTokens() {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'POST',
        url: 'https://' + location.hostname + ':4443/api/tokens',
        data: JSON.stringify({ session: this.sessionId }),
        headers: {
          'Authorization': 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
          'Content-Type': 'application/json'
        },
        success: (response) => {
          resolve(response.id)
        },
        error: (error) => { reject(error) }
      });
    });
  }

}