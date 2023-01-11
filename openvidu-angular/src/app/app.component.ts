import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { OpenVidu, Publisher, Session, StreamEvent, StreamManager, Subscriber } from 'openvidu-browser';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {

  APPLICATION_SERVER_URL = environment.applicationServerUrl;

  // OpenVidu objects
  OV: OpenVidu;
  session: Session;
  publisher: StreamManager; // Local
  subscribers: StreamManager[] = []; // Remotes

  // Join form
  mySessionId: string;
  myUserName: string;

  // Main video of the page, will be 'publisher' or one of the 'subscribers',
  // updated by click event in UserVideoComponent children
  mainStreamManager: StreamManager;

  constructor(private httpClient: HttpClient) {
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

      // Subscribe to the Stream to receive it. Second parameter is undefined
      // so OpenVidu doesn't create an HTML video by its own
      let subscriber: Subscriber = this.session.subscribe(event.stream, undefined);
      this.subscribers.push(subscriber);
    });

    // On every Stream destroyed...
    this.session.on('streamDestroyed', (event: StreamEvent) => {

      // Remove the stream from 'subscribers' array
      this.deleteSubscriber(event.stream.streamManager);
    });

    // On every asynchronous exception...
    this.session.on('exception', (exception) => {
      console.warn(exception);
    });

    // --- 4) Connect to the session with a valid user token ---

    // Get a token from the OpenVidu deployment
    this.getToken().then(token => {

      // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
      // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
      this.session.connect(token, { clientData: this.myUserName })
        .then(() => {

          // --- 5) Get your own camera stream ---

          // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
          // element: we will manage it on our own) and with the desired properties
          let publisher: Publisher = this.OV.initPublisher(undefined, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: true,     // Whether you want to start publishing with your audio unmuted or not
            publishVideo: true,     // Whether you want to start publishing with your video enabled or not
            resolution: '640x480',  // The resolution of your video
            frameRate: 30,          // The frame rate of your video
            insertMode: 'APPEND',   // How the video is inserted in the target element 'video-container'
            mirror: false           // Whether to mirror your local video or not
          });

          // --- 6) Publish your stream ---

          this.session.publish(publisher);

          // Set the main video in the page to display our webcam and store our Publisher
          this.mainStreamManager = publisher;
          this.publisher = publisher;
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
    this.subscribers = [];
    delete this.publisher;
    delete this.session;
    delete this.OV;
    this.generateParticipantInfo();
  }


  private generateParticipantInfo() {
    // Random user nickname and sessionId
    this.mySessionId = 'SessionA';
    this.myUserName = 'Participant' + Math.floor(Math.random() * 100);
  }

  private deleteSubscriber(streamManager: StreamManager): void {
    let index = this.subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }

  updateMainStreamManager(streamManager: StreamManager) {
    this.mainStreamManager = streamManager;
  }


  /**
   * --------------------------------------------
   * GETTING A TOKEN FROM YOUR APPLICATION SERVER
   * --------------------------------------------
   * The methods below request the creation of a Session and a Token to
   * your application server. This keeps your OpenVidu deployment secure.
   *
   * In this sample code, there is no user control at all. Anybody could
   * access your application server endpoints! In a real production
   * environment, your application server must identify the user to allow
   * access to the endpoints.
   *
   * Visit https://docs.openvidu.io/en/stable/application-server to learn
   * more about the integration of OpenVidu in your application server.
   */

  async getToken(): Promise<string> {
    const sessionId = await this.createSession(this.mySessionId);
    return await this.createToken(sessionId);
  }

  createSession(sessionId) {
    return this.httpClient.post(
      this.APPLICATION_SERVER_URL + 'api/sessions',
      { customSessionId: sessionId },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'text' }
    ).toPromise();
  }

  createToken(sessionId) {
    return this.httpClient.post(
      this.APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
      {},
      { headers: { 'Content-Type': 'application/json' }, responseType: 'text' }
    ).toPromise();
  }

}
