import { Component, HostListener, Input, OnDestroy } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { throwError as observableThrowError, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { OpenVidu, Session, Stream, StreamEvent } from 'openvidu-browser';

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
  mySessionId: string;
  myUserName: string;

  // Main video of the page, will be 'localStream' or one of the 'remoteStreams',
  // updated by an Output event of StreamComponent children
  @Input() mainVideoStream: Stream;

  constructor(private http: Http) {
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

    // --- 1) Get an OpenVidu object ---

    this.OV = new OpenVidu();

    // --- 2) Init a session ---

    this.session = this.OV.initSession();


    // --- 3) Specify the actions when events take place in the session ---

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

      // Remove the stream from 'remoteStreams' array
      this.deleteRemoteStream(event.stream);
    });


    // --- 4) Connect to the session with a valid user token ---

    // 'getToken' method is simulating what your server-side should do.
    // 'token' parameter should be retrieved and returned by your own backend
    this.getToken().then(token => {

      // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
      // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
      this.session.connect(token, { clientData: this.myUserName })
        .then(() => {

          // --- 5) Get your own camera stream ---

          // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
          // element: we will manage it ourselves) and with the desired properties
          let publisher = this.OV.initPublisher(undefined, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: true,     // Whether you want to start publishing with your audio unmuted or not
            publishVideo: true,     // Whether you want to start publishing with your video enabled or not
            resolution: '640x480',  // The resolution of your video
            frameRate: 30,          // The frame rate of your video
            insertMode: 'APPEND',   // How the video is inserted in the target element 'video-container'
            mirror: false           // Whether to mirror your local video or not
          });

          // Store your webcam stream in 'localStream' object
          this.localStream = publisher.stream;
          // Set the main video in the page to display our webcam
          this.mainVideoStream = this.localStream;

          // --- 6) Publish your stream ---

          this.session.publish(publisher);
        })
        .catch(error => {
          console.log('There was an error connecting to the session:', error.code, error.message);
        });
    });
  }

  leaveSession() {

    // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

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
    this.mySessionId = 'SessionA';
    this.myUserName = 'Participant' + Math.floor(Math.random() * 100);
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
   * This method retrieve the mandatory user token from OpenVidu Server,
   * in this case making use of OpenVidu Node Client.
   * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION. In this case:
   *   1) Initialize a session in OpenVidu Server (OpenVidu.createSession with OpenVidu Node Client)
   *   2) Generate a token in OpenVidu Server		  (Session.generateToken with OpenVidu Node Client)
   *   3) The token must be consumed in Session.connect() method of OpenVidu Browser
   */

  getToken(): Promise<string> {
    return this.createSession(this.mySessionId).then(
      sessionId => {
        return this.createToken(sessionId);
      })
  }

  createSession(sessionId) {
    return new Promise((resolve, reject) => {

      const body = JSON.stringify({ customSessionId: sessionId });
      const headers = new Headers({
        'Authorization': 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
        'Content-Type': 'application/json',
      });
      const options = new RequestOptions({ headers });
      return this.http.post('https://' + location.hostname + ':4443/api/sessions', body, options)
        .pipe(
          catchError(error => {
            error.status === 409 ? resolve(sessionId) : reject(error);
            return observableThrowError(error);
          })
        )
        .subscribe(response => {
          console.log(response);
          resolve(response.json().id);
        });
    });
  }

  createToken(sessionId): Promise<string> {
    return new Promise((resolve, reject) => {

      const body = JSON.stringify({ session: sessionId });
      const headers = new Headers({
        'Authorization': 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
        'Content-Type': 'application/json',
      });
      const options = new RequestOptions({ headers });
      return this.http.post('https://' + location.hostname + ':4443/api/tokens', body, options)
        .pipe(
          catchError(error => {
            reject(error);
            return observableThrowError(error);
          })
        )
        .subscribe(response => {
          console.log(response);
          resolve(response.json().token);
        });
    });
  }

}
