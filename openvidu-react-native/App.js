import axios from 'axios';
import React, { Component } from 'react';
import { Button, Image, Modal, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';

import { OpenVidu, OpenViduReactNativeAdapter, RTCView } from 'openvidu-react-native-adapter';

export default class App extends Component {
	constructor(props) {
		super(props);

		const ovReact = new OpenViduReactNativeAdapter();
		ovReact.initialize();

		this.state = {
			mySessionId: 'react-native',
			myUserName: 'Participant' + Math.floor(Math.random() * 100),
			session: undefined,
			mainStreamManager: undefined,
			subscribers: [],
			role: 'PUBLISHER',
			mirror: true,
			videoSource: undefined,
			video: true,
			audio: true,
			speaker: false,
			joinBtnEnabled: true,
			isReconnecting: false,
			connected: false,
			openviduUrl: 'https://localhost:4443/',
			openviduSecret: 'MY_SECRET',
			settingsModalVisible: false,
			tempOpenviduUrl: 'https://localhost:4443/',
			tempOpenviduSecret: 'MY_SECRET',
		};
	}

	componentDidMount() {
		//this.joinSession();
	}

	// componentWillUnmount() {
	// this.leaveSession();
	// }

	async checkAndroidPermissions() {
		try {
			const camera = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
				title: 'Camera Permission',
				message: 'OpenVidu needs access to your camera',
				buttonNeutral: 'Ask Me Later',
				buttonNegative: 'Cancel',
				buttonPositive: 'OK',
			});
			const audio = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
				title: 'Audio Permission',
				message: 'OpenVidu needs access to your microphone',
				buttonNeutral: 'Ask Me Later',
				buttonNegative: 'Cancel',
				buttonPositive: 'OK',
			});
			const storage = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
				title: 'STORAGE',
				message: 'OpenVidu  needs access to your storage ',
				buttonNeutral: 'Ask Me Later',
				buttonNegative: 'Cancel',
				buttonPositive: 'OK',
			});
			if (camera === PermissionsAndroid.RESULTS.GRANTED) {
				console.log('You can use the camera');
			} else {
				console.log('Camera permission denied');
			}
			if (audio === PermissionsAndroid.RESULTS.GRANTED) {
				console.log('You can use the audio');
			} else {
				console.log('audio permission denied');
			}
			if (storage === PermissionsAndroid.RESULTS.GRANTED) {
				console.log('You can use the storage');
			} else {
				console.log('storage permission denied');
			}
		} catch (err) {
			console.warn(err);
		}
	}

	joinSession(role) {
		// --- 1) Get an OpenVidu object ---

		this.OV = new OpenVidu();
		this.OV.enableProdMode();

		// --- 2) Init a session ---

		this.setState(
			{
				joinBtnEnabled: false,
				session: this.OV.initSession(),
				role,
			},
			async () => {
				// --- 3) Specify the actions when events take place in the session ---

				const mySession = this.state.session;

				// On every new Stream received...
				mySession.on('streamCreated', async (event) => {
					// Subscribe to the Stream to receive it. Second parameter is undefined
					// so OpenVidu doesn't create an HTML video by its own
					const subscriber = await mySession.subscribeAsync(event.stream, undefined);
					var subscribers = Array.from(this.state.subscribers);
					subscribers.push(subscriber);
					// Update the state with the new subscribers
					this.setState({
						subscribers: subscribers,
					});
				});

				// On every Stream destroyed...
				mySession.on('streamDestroyed', (event) => {
					event.preventDefault();
					// Remove the stream from 'subscribers' array
					this.deleteSubscriber(event.stream);
				});

				// On every asynchronous exception...
				mySession.on('exception', (exception) => {
					console.warn(exception);
				});

				// On reconnection events
				mySession.on('reconnecting', () => {
					console.warn('Oops! Trying to reconnect to the session');
					this.setState({ isReconnecting: true });
				});

				mySession.on('reconnected', () => {
					console.log('Hurray! You successfully reconnected to the session');
					setTimeout(() => {
						// Force re-render view updating state avoiding frozen streams
						this.setState({ isReconnecting: false });
					}, 2000);
				});

				mySession.on('sessionDisconnected', (event) => {
					if (event.reason === 'networkDisconnect') {
						console.warn('Dang-it... You lost your connection to the session');
						this.leaveSession();
					} else {
						// Disconnected from the session for other reason than a network drop
					}
				});

				try {
					// --- 4) Connect to the session with a valid user token ---
					// Get a token from the OpenVidu deployment
					const token = await this.getToken();
					// First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
					// 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
					await mySession.connect(token, { clientData: this.state.myUserName });

					if (Platform.OS === 'android') {
						await this.checkAndroidPermissions();
					}

					// --- 5) Get your own camera stream ---
					if (this.state.role !== 'SUBSCRIBER') {
						// Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
						// element: we will manage it on our own) and with the desired properties

						const publisher = await this.OV.initPublisherAsync(undefined, {
							audioSource: undefined, // The source of audio. If undefined default microphone
							videoSource: undefined, // The source of video. If undefined default webcam
							publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
							publishVideo: true, // Whether you want to start publishing with your video enabled or not
							resolution: '640x480', // The resolution of your video
							frameRate: 30, // The frame rate of your video
							insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
						});

						// --- 6) Publish your stream ---

						// Set the main video in the page to display our webcam and store our Publisher
						this.setState(
							{
								mainStreamManager: publisher,
								videoSource: !publisher.properties.videoSource ? '1' : publisher.properties.videoSource, // 0: back camera | 1: user camera |
							},
							() => {
								mySession.publish(publisher);
							},
						);
					}
					this.setState({ connected: true });
				} catch (error) {
					console.log(error);
					console.log('There was an error connecting to the session:', error.code, error.message);
					this.setState({
						joinBtnEnabled: true,
					});
				}
			},
		);
	}

	getNicknameTag(stream) {
		// Gets the nickName of the user
		try {
			if (stream.connection && JSON.parse(stream.connection.data) && JSON.parse(stream.connection.data).clientData) {
				return JSON.parse(stream.connection.data).clientData;
			}
		} catch (error) { }
		return '';
	}

	deleteSubscriber(stream) {
		var subscribers = Array.from(this.state.subscribers);
		const index = subscribers.indexOf(stream.streamManager, 0);
		if (index > -1) {
			subscribers.splice(index, 1);
			this.setState({
				subscribers: subscribers,
			});
		}
	}

	leaveSession() {
		// --- 7) Leave the session by calling 'disconnect' method over the Session object ---

		const mySession = this.state.session;

		if (mySession) {
			mySession.disconnect();
		}

		// Empty all properties...
		setTimeout(() => {
			this.OV = null;
			this.setState({
				session: undefined,
				subscribers: [],
				mySessionId: 'testReact',
				myUserName: 'Participant' + Math.floor(Math.random() * 100),
				mainStreamManager: undefined,
				publisher: undefined,
				joinBtnEnabled: true,
				connected: false,
			});
		});
	}

	toggleCamera() {
		/**
		 * _switchCamera() Method provided by react-native-webrtc:
		 * This function allows to switch the front / back cameras in a video track on the fly, without the need for adding / removing tracks or renegotiating
		 */

		const camera = this.state.mainStreamManager.stream.getMediaStream().getVideoTracks()[0];
		if (camera) {
			camera._switchCamera();
			this.setState({ mirror: !this.state.mirror });
		}

		/**
		 * Traditional way:
		 * Renegotiating stream and init new publisher to change the camera
		 */
		/*
		this.OV.getDevices().then(devices => {
			console.log("DEVICES => ", devices);
			let device = devices.filter(device => device.kind === 'videoinput' && device.deviceId !== this.state.videoSource)[0]
			const properties = {
				audioSource: undefined,
				videoSource: device.deviceId,
				publishAudio: true,
				publishVideo: true,
				resolution: '640x480',
				frameRate: 30,
				insertMode: 'APPEND',
			}

			let publisher = this.OV.initPublisher(undefined, properties);

			this.state.session.unpublish(this.state.mainStreamManager);

			this.setState({
				videoSource : device.deviceId,
				mainStreamManager: publisher,
				mirror: !this.state.mirror
			});
			this.state.session.publish(publisher);
		});
		*/
	}

	muteUnmuteMic() {
		this.state.mainStreamManager.publishAudio(!this.state.audio);
		this.setState({ audio: !this.state.audio });
	}

	muteUnmuteCamera() {
		this.state.mainStreamManager.publishVideo(!this.state.video);
		this.setState({ video: !this.state.video });
	}

	muteUnmuteSpeaker() {
		InCallManager.setSpeakerphoneOn(!this.state.speaker);
		this.setState({ speaker: !this.state.speaker });
	}

	openSettingsModal() {
		this.setState({
			settingsModalVisible: true,
			tempOpenviduUrl: this.state.openviduUrl,
			tempOpenviduSecret: this.state.openviduSecret,
		});
	}

	closeSettingsModal() {
		this.setState({ settingsModalVisible: false });
	}

	saveSettings() {
		this.setState({
			openviduUrl: this.state.tempOpenviduUrl,
			openviduSecret: this.state.tempOpenviduSecret,
			settingsModalVisible: false,
		});
	}

	render() {
		return (
			<ScrollView>
				{/* Settings Modal */}
				<Modal
					animationType="slide"
					transparent={true}
					visible={this.state.settingsModalVisible}
					onRequestClose={() => this.closeSettingsModal()}>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContainer}>
							<Text style={styles.modalTitle}>OpenVidu Settings</Text>

							<Text style={styles.label}>OpenVidu URL:</Text>
							<TextInput
								style={styles.input}
								onChangeText={(tempOpenviduUrl) => this.setState({ tempOpenviduUrl })}
								value={this.state.tempOpenviduUrl}
								placeholder="https://your-openvidu-server.com/"
								autoCapitalize="none"
							/>

							<Text style={styles.label}>OpenVidu Secret:</Text>
							<TextInput
								style={styles.input}
								onChangeText={(tempOpenviduSecret) => this.setState({ tempOpenviduSecret })}
								value={this.state.tempOpenviduSecret}
								placeholder="MY_SECRET"
								secureTextEntry={true}
								autoCapitalize="none"
							/>

							<View style={styles.modalButtons}>
								<View style={styles.modalButton}>
									<Button
										onPress={() => this.closeSettingsModal()}
										title="Cancel"
										color="#999"
									/>
								</View>
								<View style={styles.modalButton}>
									<Button
										onPress={() => this.saveSettings()}
										title="Save"
										color="#841584"
									/>
								</View>
							</View>
						</View>
					</View>
				</Modal>

				{this.state.connected ? (
					<View>
						{this.state.mainStreamManager && this.state.mainStreamManager.stream && (
							<View style={styles.container}>
								<Text>Session: {this.state.mySessionId}</Text>
								<Text>{this.getNicknameTag(this.state.mainStreamManager.stream)}</Text>
								<RTCView
									zOrder={0}
									objectFit="cover"
									mirror={this.state.mirror}
									streamURL={this.state.mainStreamManager.stream.getMediaStream().toURL()}
									style={styles.selfView}
								/>
							</View>
						)}

						<View>
							<View style={styles.button}>
								<Button
									disabled={this.state.role === 'SUBSCRIBER'}
									onLongPress={() => this.toggleCamera()}
									onPress={() => this.toggleCamera()}
									title="Toggle Camera"
									color="#841584"
								/>
							</View>

							<View style={styles.button}>
								<Button
									disabled={this.state.role === 'SUBSCRIBER'}
									onLongPress={() => this.muteUnmuteMic()}
									onPress={() => this.muteUnmuteMic()}
									title={this.state.audio ? 'Mute Microphone' : 'Unmute Microphone'}
									color="#3383FF"
								/>
							</View>
							<View style={styles.button}>
								<Button
									disabled={this.state.role === 'SUBSCRIBER'}
									onLongPress={() => this.muteUnmuteSpeaker()}
									onPress={() => this.muteUnmuteSpeaker()}
									title={this.state.speaker ? 'Mute Speaker' : 'Unmute Speaker'}
									color="#79b21e"
								/>
							</View>
							<View style={styles.button}>
								<Button
									disabled={this.state.role === 'SUBSCRIBER'}
									onLongPress={() => this.muteUnmuteCamera()}
									onPress={() => this.muteUnmuteCamera()}
									title={this.state.video ? 'Mute Camera' : 'Unmute Camera'}
									color="#00cbff"
								/>
							</View>

							<View style={styles.button}>
								<Button
									onLongPress={() => this.leaveSession()}
									onPress={() => this.leaveSession()}
									title="Leave Session"
									color="#ff0000"
								/>
							</View>
						</View>
					</View>
				) : (
					<View>
						<View
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								padding: 20,
								height: 300,
								width: '100%',
							}}>
							<Image style={styles.img} source={require('./resources/images/openvidu_grey_bg_transp_cropped.png')} />
						</View>
						<View style={{ justifyContent: 'center', alignItems: 'center' }}>
							<TextInput
								style={{ width: '90%', height: 40, borderColor: 'gray', borderWidth: 1 }}
								onChangeText={(mySessionId) => this.setState({ mySessionId })}
								value={this.state.mySessionId}
							/>
						</View>

						<View style={styles.button}>
							<Button
								disabled={!this.state.joinBtnEnabled}
								onLongPress={() => this.joinSession('PUBLISHER')}
								onPress={() => this.joinSession('PUBLISHER')}
								title="Join as publisher"
								color="#841584"
							/>
						</View>

						<View style={styles.button}>
							<Button
								disabled={!this.state.joinBtnEnabled}
								onLongPress={() => this.joinSession('SUBSCRIBER')}
								onPress={() => this.joinSession('SUBSCRIBER')}
								title="Join as subscriber"
								color="#00cbff"
							/>
						</View>

						<View style={styles.button}>
							<Button
								onPress={() => this.openSettingsModal()}
								title="Settings"
								color="#666"
							/>
						</View>
					</View>
				)}

				<View style={[styles.container, { flexDirection: 'row', flexWrap: 'wrap' }]}>
					{this.state.subscribers.map((item, index) => {
						return (
							<View key={index}>
								<Text>{this.getNicknameTag(item.stream)}</Text>
								<RTCView
									zOrder={0}
									objectFit="cover"
									style={styles.remoteView}
									streamURL={item.stream.getMediaStream().toURL()}
								/>
							</View>
						);
					})}
				</View>
			</ScrollView>
		);
	}

	/**
	 * --------------------------------------------
	 * GETTING A TOKEN FROM OPENVIDU SERVER
	 * --------------------------------------------
	 * The methods below request the creation of a Session and a Token to
	 * openvidu-server. In a real app this code should be secure in your
	 * application server.
	 *
	 * Visit https://docs.openvidu.io/en/stable/application-server to learn
	 * more about the integration of OpenVidu in your application server.
	 */
	async getToken() {
		const sessionId = await this.createSession(this.state.mySessionId);
		return await this.createToken(sessionId);
	}

	async createSession(sessionId) {
		await axios.post(
			this.state.openviduUrl + 'openvidu/api/sessions',
			{ customSessionId: sessionId },
			{
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + this.state.openviduSecret)
				},
			},
		);
		return sessionId;
	}

	async createToken(sessionId) {
		const response = await axios.post(
			this.state.openviduUrl + 'openvidu/api/sessions/' + sessionId + '/connection',
			{},
			{
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + this.state.openviduSecret)
				},
			},
		);
		return response.data.token;
	}
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
		paddingTop: Platform.OS === 'ios' ? 20 : 0,
	},
	selfView: {
		width: '100%',
		height: 300,
	},
	remoteView: {
		width: 150,
		height: 150,
	},
	button: {
		padding: 10,
	},
	img: {
		height: '60%',
		maxWidth: '90%',
		resizeMode: 'stretch',
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContainer: {
		width: '85%',
		backgroundColor: 'white',
		borderRadius: 10,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		marginTop: 10,
		marginBottom: 5,
	},
	input: {
		height: 40,
		borderColor: 'gray',
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 10,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 20,
	},
	modalButton: {
		flex: 1,
		marginHorizontal: 5,
	},
});
