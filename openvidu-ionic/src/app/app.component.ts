import { Component, OnDestroy, Input, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError as observableThrowError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { OpenVidu, Session, StreamManager, Publisher, Subscriber, StreamEvent } from 'openvidu-browser';

import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.css'],
})
export class AppComponent implements OnDestroy {
    OPENVIDU_SERVER_URL = 'https://' + location.hostname + ':4443';
    OPENVIDU_SERVER_SECRET = 'MY_SECRET';

    ANDROID_PERMISSIONS = [
        this.androidPermissions.PERMISSION.CAMERA,
        this.androidPermissions.PERMISSION.RECORD_AUDIO,
        this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS,
    ];

    // OpenVidu objects
    OV: OpenVidu;
    session: Session;
    publisher: StreamManager; // Local
    subscribers: StreamManager[] = []; // Remotes

    // Join form
    mySessionId: string;
    myUserName: string;

    // Main video of the page, will be 'publisher' or one of the 'subscribers',
    mainStreamManager: StreamManager;

    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private httpClient: HttpClient,
        private androidPermissions: AndroidPermissions,
    ) {
        this.initializeApp();
        this.generateParticipantInfo();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();
        });
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
            const subscriber: Subscriber = this.session.subscribe(event.stream, undefined);
            this.subscribers.push(subscriber);
        });

        // On every Stream destroyed...
        this.session.on('streamDestroyed', (event: StreamEvent) => {
            // Remove the stream from 'subscribers' array
            this.deleteSubscriber(event.stream.streamManager);
        });

        // --- 4) Connect to the session with a valid user token ---

        // 'getToken' method is simulating what your server-side should do.
        // 'token' parameter should be retrieved and returned by your own backend
        this.getToken().then((token) => {
            // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
            // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
            this.session
                .connect(
                    token,
                    { clientData: this.myUserName },
                )
                .then(() => {
                    // --- 5) Requesting and Checking Android Permissions

                    if (this.platform.is('cordova')) {
                        this.checkAndroidPermissions()
                            .then(() => {
                                this.initPublisher();
                            })
                            .catch((err) => console.error(err));
                    } else {
                        this.initPublisher();
                    }
                })
                .catch((error) => {
                    console.log('There was an error connecting to the session:', error.code, error.message);
                });
        });
    }

    initPublisher() {
        console.log('INITIALIZING PUBLISHER');
        // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
        // element: we will manage it on our own) and with the desired properties
        const publisher: Publisher = this.OV.initPublisher(undefined, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
            publishVideo: true, // Whether you want to start publishing with your video enabled or not
            resolution: '640x480', // The resolution of your video
            frameRate: 30, // The frame rate of your video
            insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
            mirror: true, // Whether to mirror your local video or not
        });

        // --- 6) Publish your stream ---

        this.session.publish(publisher);

        // Set the main video in the page to display our webcam and store our Publisher
        this.mainStreamManager = publisher;
        this.publisher = publisher;
    }

    updateMainStreamManager(streamManager: StreamManager) {
        this.mainStreamManager = streamManager;
    }

    leaveSession() {
        // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

        if (this.session) {
            this.session.disconnect();
        }

        // Empty all properties...
        this.subscribers = [];
        delete this.publisher;
        delete this.session;
        delete this.OV;
        this.generateParticipantInfo();
    }

    private checkAndroidPermissions(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.platform.ready().then(() => {
                this.androidPermissions
                    .requestPermissions(this.ANDROID_PERMISSIONS)
                    .then(() => {
                        this.androidPermissions
                            .checkPermission(this.androidPermissions.PERMISSION.CAMERA)
                            .then((camera) => {
                                this.androidPermissions
                                    .checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO)
                                    .then((audio) => {
                                        this.androidPermissions
                                            .checkPermission(this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS)
                                            .then((modifyAudio) => {
                                                if (camera.hasPermission && audio.hasPermission && modifyAudio.hasPermission) {
                                                    resolve();
                                                } else {
                                                    reject(
                                                        new Error(
                                                            'Permissions denied: ' +
                                                                '\n' +
                                                                ' CAMERA = ' +
                                                                camera.hasPermission +
                                                                '\n' +
                                                                ' AUDIO = ' +
                                                                audio.hasPermission +
                                                                '\n' +
                                                                ' AUDIO_SETTINGS = ' +
                                                                modifyAudio.hasPermission,
                                                        ),
                                                    );
                                                }
                                            })
                                            .catch((err) => {
                                                console.error(
                                                    'Checking permission ' +
                                                        this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS +
                                                        ' failed',
                                                );
                                                reject(err);
                                            });
                                    })
                                    .catch((err) => {
                                        console.error(
                                            'Checking permission ' + this.androidPermissions.PERMISSION.RECORD_AUDIO + ' failed',
                                        );
                                        reject(err);
                                    });
                            })
                            .catch((err) => {
                                console.error('Checking permission ' + this.androidPermissions.PERMISSION.CAMERA + ' failed');
                                reject(err);
                            });
                    })
                    .catch((err) => console.error('Error requesting permissions: ', err));
            });
        });
    }

    private generateParticipantInfo() {
        // Random user nickname and sessionId
        this.mySessionId = 'SessionA';
        this.myUserName = 'Participant' + Math.floor(Math.random() * 100);
    }

    private deleteSubscriber(streamManager: StreamManager): void {
        const index = this.subscribers.indexOf(streamManager, 0);
        if (index > -1) {
            this.subscribers.splice(index, 1);
        }
    }

    /*
     * --------------------------
     * SERVER-SIDE RESPONSIBILITY
     * --------------------------
     * This method retrieve the mandatory user token from OpenVidu Server,
     * in this case making use Angular http API.
     * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION. In this case:
     *   1) Initialize a session in OpenVidu Server	 (POST /api/sessions)
     *   2) Generate a token in OpenVidu Server		   (POST /api/tokens)
     *   3) The token must be consumed in Session.connect() method of OpenVidu Browser
     */

    getToken(): Promise<string> {
        return this.createSession(this.mySessionId).then((sessionId) => {
            return this.createToken(sessionId);
        });
    }

    createSession(sessionId) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({ customSessionId: sessionId });
            const options = {
                headers: new HttpHeaders({
                    Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                    'Content-Type': 'application/json',
                }),
            };
            return this.httpClient
                .post(this.OPENVIDU_SERVER_URL + '/api/sessions', body, options)
                .pipe(
                    catchError((error) => {
                        if (error.status === 409) {
                            resolve(sessionId);
                        } else {
                            console.warn(
                                'No connection to OpenVidu Server. This may be a certificate error at ' +
                                    this.OPENVIDU_SERVER_URL,
                            );
                            if (
                                window.confirm(
                                    'No connection to OpenVidu Server. This may be a certificate error at "' +
                                        this.OPENVIDU_SERVER_URL +
                                        // tslint:disable-next-line:max-line-length
                                        '"\n\nClick OK to navigate and accept it. If no certificate warning is shown, then check that your OpenVidu Server' +
                                        'is up and running at "' +
                                        this.OPENVIDU_SERVER_URL +
                                        '"',
                                )
                            ) {
                                location.assign(this.OPENVIDU_SERVER_URL + '/accept-certificate');
                            }
                        }
                        return observableThrowError(error);
                    }),
                )
                .subscribe((response) => {
                    console.log(response);
                    resolve(response['id']);
                });
        });
    }

    createToken(sessionId): Promise<string> {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({ session: sessionId });
            const options = {
                headers: new HttpHeaders({
                    Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                    'Content-Type': 'application/json',
                }),
            };
            return this.httpClient
                .post(this.OPENVIDU_SERVER_URL + '/api/tokens', body, options)
                .pipe(
                    catchError((error) => {
                        reject(error);
                        return observableThrowError(error);
                    }),
                )
                .subscribe((response) => {
                    console.log(response);
                    resolve(response['token']);
                });
        });
    }
}
