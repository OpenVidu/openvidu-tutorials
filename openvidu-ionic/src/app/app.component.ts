import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { AlertController, Platform } from '@ionic/angular';
import {
	Device,
	OpenVidu,
	Publisher,
	PublisherProperties,
	Session,
	StreamEvent,
	StreamManager,
	Subscriber
} from 'openvidu-browser';

@Component({
	selector: 'app-root',
	templateUrl: 'app.component.html',
	styleUrls: ['app.component.scss']
})
export class AppComponent implements OnDestroy {

	APPLICATION_SERVER_URL = 'http://localhost:5000/';

	ANDROID_PERMISSIONS = [
		this.androidPermissions.PERMISSION.CAMERA,
		this.androidPermissions.PERMISSION.RECORD_AUDIO,
		this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS
	];

	// OpenVidu objects
	OV: OpenVidu;
	session: Session;
	publisher: StreamManager; // Local
	subscribers: StreamManager[] = []; // Remotes

	// Join form
	mySessionId: string;
	myUserName: string;

	cameraIcon = 'videocam';
	microphoneIcon = 'mic';

	private devices: Device[];
	private cameras: Device[];
	private microphones: Device[];
	private cameraSelected: Device;
	private microphoneSelected: Device;
	private isFrontCamera: boolean = false;

	constructor(
		private httpClient: HttpClient,
		private platform: Platform,
		private androidPermissions: AndroidPermissions,
		private alertController: AlertController
	) {

		this.generateParticipantInfo();

		// WARNING!! To make easier first steps with mobile devices, this code allows
		// using the demos OpenVidu deployment when no custom deployment is provided
		if (this.platform.is('hybrid') && this.APPLICATION_SERVER_URL === 'http://localhost:5000/') {
			/**
			 * WARNING: this APPLICATION_SERVER_URL is not secure and is only meant for a first quick test.
			 * Anyone could access your video sessions. You should modify the APPLICATION_SERVER_URL to a custom private one.
			 */
			this.APPLICATION_SERVER_URL = 'https://demos.openvidu.io/';
		}

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

	async joinSession() {
		// --- 1) Get an OpenVidu object ---

		this.OV = new OpenVidu();

		// --- 2) Init a session ---

		this.session = this.OV.initSession();

		// --- 3) Specify the actions when events take place in the session ---

		// On every new Stream received...
		this.session.on('streamCreated', (event: StreamEvent) => {
			// Subscribe to the Stream to receive it. Second parameter is undefined
			// so OpenVidu doesn't create an HTML video on its own
			const subscriber: Subscriber = this.session.subscribe(event.stream, undefined);
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

		try {
			// Get a token from the OpenVidu deployment
			const token = await this.getToken();
			// First param is the token got from OpenVidu deployment. Second param will be used by every user on event
			// 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
			await this.session.connect(token, { clientData: this.myUserName });

			// --- 5) Requesting and Checking Android Permissions
			if (this.platform.is('hybrid') && this.platform.is('android')) {
				console.log('Ionic Android platform');
				await this.checkAndroidPermissions();
			}

			this.initPublisher();
		} catch (error) {
			console.log('There was an error connecting to the session:', error.code, error.message);
		}
	}

	async initPublisher() {
		// Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
		// element: we will manage it on our own) and with the desired properties
		const publisher: Publisher = await this.OV.initPublisherAsync(undefined, {
			audioSource: undefined, // The source of audio. If undefined default microphone
			videoSource: undefined, // The source of video. If undefined default webcam
			publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
			publishVideo: true, // Whether you want to start publishing with your video enabled or not
			resolution: '640x480', // The resolution of your video
			frameRate: 30, // The frame rate of your video
			insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
			mirror: this.isFrontCamera // Whether to mirror your local video or not
		});

		publisher.on('accessAllowed', () => this.initDevices());

		// --- 6) Publish your stream ---

		await this.session.publish(publisher);
		// Store our Publisher
		this.publisher = publisher;
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

	async swapCamera() {
		try {
			const newCamera = this.cameras.find(cam => cam.deviceId !== this.cameraSelected.deviceId);
			if (!!newCamera) {
				this.isFrontCamera = !this.isFrontCamera;
				const pp: PublisherProperties = {
					videoSource: newCamera.deviceId,
					audioSource: false,
					mirror: this.isFrontCamera
				};

				// Stopping the video tracks before request for another MediaStream
				// Only one unique device can be used at same time
				this.publisher.stream.getMediaStream().getVideoTracks()[0].stop();
				const newTrack = await this.OV.getUserMedia(pp);
				const videoTrack: MediaStreamTrack = newTrack.getVideoTracks()[0];
				await (this.publisher as Publisher).replaceTrack(videoTrack);
				this.cameraSelected = newCamera;
			}
		} catch (error) {
			console.error(error);
		}
	}
	toggleCamera() {
		const publish = !this.publisher.stream.videoActive;
		(this.publisher as Publisher).publishVideo(publish, true);
		this.cameraIcon = publish ? 'videocam' : 'eye-off';
	}

	toggleMicrophone() {
		const publish = !this.publisher.stream.audioActive;
		(this.publisher as Publisher).publishAudio(publish);
		this.microphoneIcon = publish ? 'mic' : 'mic-off';
	}

	private async initDevices() {
		this.devices = await this.OV.getDevices();

		this.cameras = this.devices.filter(d => d.kind === 'videoinput');
		this.microphones = this.devices.filter(d => d.kind === 'audioinput' && d.label !== 'Default');

		this.cameraSelected = this.cameras[0];
		this.microphoneSelected = this.microphones[0];
	}

	private async checkAndroidPermissions(): Promise<void> {
		await this.platform.ready();
		try {
			await this.androidPermissions.requestPermissions(this.ANDROID_PERMISSIONS);
			const promisesArray: Promise<any>[] = [];
			this.ANDROID_PERMISSIONS.forEach((permission) => {
				console.log('Checking ', permission);
				promisesArray.push(this.androidPermissions.checkPermission(permission));
			});
			const responses = await Promise.all(promisesArray);
			let allHasPermissions = true;
			responses.forEach((response, i) => {
				allHasPermissions = response.hasPermission;
				if (!allHasPermissions) {
					throw (new Error('Permissions denied: ' + this.ANDROID_PERMISSIONS[i]));
				}
			});
		} catch (error) {
			console.error('Error requesting or checking permissions: ', error);
			throw (error);
		}
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

	async presentSettingsAlert() {
		const alert = await this.alertController.create({
			header: 'OpenVidu deployment',
			inputs: [
				{
					name: 'url',
					type: 'text',
					value: this.APPLICATION_SERVER_URL,
					placeholder: 'URL',
					id: 'url-input',
				}
			],
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
					id: 'cancel-btn',
					cssClass: 'secondary',
				},
				{
					text: 'Ok',
					id: 'ok-btn',
					handler: (data) => {
						this.APPLICATION_SERVER_URL = data.url;
					},
				},
			],
		});

		await alert.present();
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

	async createSession(sessionId) {
		const response = this.httpClient.post(
			this.APPLICATION_SERVER_URL + 'api/sessions',
			{ customSessionId: sessionId },
			{ headers: { 'Content-Type': 'application/json' }, responseType: 'text' }
		);
		return lastValueFrom(response);
	}

	async createToken(sessionId) {
		const response = this.httpClient.post(
			this.APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections',
			{},
			{ headers: { 'Content-Type': 'application/json' }, responseType: 'text' }
		);
		return lastValueFrom(response);
	}
}
