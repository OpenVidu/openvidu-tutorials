import React, { Component } from 'react';
import {
    Platform,
    TextInput,
    ScrollView,
    Button,
    Alert,
    Linking,
    StyleSheet,
    Text,
    View,
    Image,
    PermissionsAndroid,
} from 'react-native';
import axios from 'axios';

import { OpenViduReactNativeAdapter, OpenVidu, RTCView } from 'openvidu-react-native-adapter';

const OPENVIDU_SERVER_URL = 'https://demos.openvidu.io';
const OPENVIDU_SERVER_SECRET = 'MY_SECRET';


type Props = {};
export default class App extends Component<Props> {
    constructor(props) {
        super(props);

        const ovReact = new OpenViduReactNativeAdapter();
        ovReact.initialize();

        this.state = {
            mySessionId: 'testReact',
            myUserName: 'Participant' + Math.floor(Math.random() * 100),
            session: undefined,
            mainStreamManager: undefined,
            subscribers: [],
            role: 'PUBLISHER',
            mirror: true,
            videoSource: undefined,
            video: true,
            audio: true
        };
    }

    componentDidMount() {
       //this.joinSession();
    }

    componentWillUnmount() {
        this.leaveSession();
    }

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

    joinSession() {
        // --- 1) Get an OpenVidu object ---

        this.OV = new OpenVidu();

        // --- 2) Init a session ---

        this.setState(
            {
                session: this.OV.initSession(),
            },
            async () => {
                const mySession = this.state.session;
                // --- 3) Specify the actions when events take place in the session ---

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

                // --- 4) Connect to the session with a valid user token ---
                // 'getToken' method is simulating what your server-side should do.
                // 'token' parameter should be retrieved and returned by your own backend
                const token = await this.getToken();
                // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
                // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
                try {
                    await mySession.connect(token, { clientData: this.state.myUserName });
                } catch (error) {
                    console.log('There was an error connecting to the session:', error.code, error.message);
                }

                if (Platform.OS == 'android') {
                    await this.checkAndroidPermissions();
                }

                // --- 5) Get your own camera stream ---
                if (this.state.role !== 'SUBSCRIBER') {
                    const properties = {
                        audioSource: undefined, // The source of audio. If undefined default microphone
                        videoSource: undefined, // The source of video. If undefined default webcam
                        publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                        publishVideo: true, // Whether you want to start publishing with your video enabled or not
                        resolution: '640x480', // The resolution of your video
                        frameRate: 30, // The frame rate of your video
                        insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
                    };
                    // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
                    // element: we will manage it on our own) and with the desired propertiesç

                    const publisher = await this.OV.initPublisherAsync(undefined, properties);
                    // --- 6) Publish your stream ---

                    // Set the main video in the page to display our webcam and store our Publisher
                    this.setState({
                        mainStreamManager: publisher,
                        videoSource: !properties.videoSource ? '1' : properties.videoSource, // 0: back camera | 1: user camera |
                    }, () => {
                        mySession.publish(publisher);
                    });
                }
            },
        );
    }

    getNicknameTag(stream) {
        // Gets the nickName of the user
        if (stream.connection && JSON.parse(stream.connection.data) && JSON.parse(stream.connection.data).clientData) {
            return JSON.parse(stream.connection.data).clientData;
        }
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
                mySessionId: 'SessionA',
                myUserName: 'Participant' + Math.floor(Math.random() * 100),
                mainStreamManager: undefined,
                publisher: undefined,
            });
        });
    }

    toggleCamera() {
        /**
         * _switchCamera() Method provided by react-native-webrtc:
         * This function allows to switch the front / back cameras in a video track on the fly, without the need for adding / removing tracks or renegotiating
         */

        const camera = this.state.mainStreamManager.stream.getMediaStream().getVideoTracks()[0];
        if(!!camera){
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

    render() {
        return (
            <ScrollView>
                {this.state.mainStreamManager ? (
                    <View>
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
                        <View>
                            <View style={styles.button}>
                                <Button
                                    onLongPress={() => this.toggleCamera()}
                                    onPress={() => this.toggleCamera()}
                                    title="Toggle Camera"
                                    color="#841584"
                                />

                            </View>
                            <View style={styles.button}>
                                <Button
                                    onLongPress={() => this.muteUnmuteMic()}
                                    onPress={() => this.muteUnmuteMic()}
                                    title={this.state.audio ? 'Mute Microphone' : 'Unmute Microphone'}
                                    color="#3383FF"
                                />
                            </View>
                            <View style={styles.button}>
                                <Button
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
                        <View style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 20}}>

                            <Image style={styles.img} source={require('./resources/images/openvidu_grey_bg_transp_cropped.png')} />
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center'}}>
                            <TextInput
                                style={{  width: '90%', height: 40, borderColor: 'gray', borderWidth: 1 }}
                                onChangeText={(mySessionId) => this.setState({ mySessionId })}
                                value={this.state.mySessionId}
                            />
                        </View>

                        <View style={styles.button}>
                            <Button
                                onLongPress={() => this.joinSession()}
                                onPress={() => this.joinSession()}
                                title="Join"
                                color="#841584"
                            />
                        </View>
                    </View>
                )}

                <View style={[styles.container, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                    {this.state.subscribers.map((item, index) => {
                        return(
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
     * --------------------------
     * SERVER-SIDE RESPONSIBILITY
     * --------------------------
     * These methods retrieve the mandatory user token from OpenVidu Server.
     * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
     * the API REST, openvidu-java-client or openvidu-node-client):
     *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
     *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
     *   3) The Connection.token must be consumed in Session.connect() method
     */

    getToken() {
        return this.createSession(this.state.mySessionId)
            .then((sessionId) => this.createToken(sessionId))
            .catch((error) => console.log(error));
    }

    createSession(sessionId) {
        return new Promise((resolve) => {
            var data = JSON.stringify({ customSessionId: sessionId });
            axios
                .post(OPENVIDU_SERVER_URL + '/openvidu/api/sessions', data, {
                    headers: {
                        Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                })
                .then((response) => {
                    console.log('CREATE SESION', response);
                    resolve(response.data.id);
                })
                .catch((response) => {
                    console.log(response);
                    var error = Object.assign({}, response);
                    if (!error.response) {
                        console.error("Network error: ", error);
                        if( error.request && error.request._response){
                            console.error("Response of the request: ", error.request._response);
                        }
                    }
                    else if (error.response && error.response.status && error.response.status === 409) {
                        console.log('RESOLVING WITH SESSIONID, 409');
                        resolve(sessionId);
                    } else {
                        console.warn(
                            'No connection to OpenVidu Server. This may be a certificate error at ' + OPENVIDU_SERVER_URL,
                        );

                        Alert.alert(
                            'No connection to OpenVidu Server.',
                            'This may be a certificate error at "' +
                                OPENVIDU_SERVER_URL +
                                '"\n\nClick OK to navigate and accept it. ' +
                                'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                                OPENVIDU_SERVER_URL +
                                '"',
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => console.log('Cancel Pressed'),
                                    style: 'cancel',
                                },
                                {
                                    text: 'OK',
                                    onPress: () =>
                                        Linking.openURL(OPENVIDU_SERVER_URL + '/accept-certificate').catch((err) =>
                                            console.error('An error occurred', err),
                                        ),
                                },
                            ],
                            { cancelable: false },
                        );
                    }
                });
        });
    }

    createToken(sessionId) {
        return new Promise((resolve, reject) => {
            var data = JSON.stringify({});
            axios
                .post(OPENVIDU_SERVER_URL + '/openvidu/api/sessions/' + sessionId + '/connection', data, {
                    headers: {
                        Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    console.log('TOKEN', response);
                    resolve(response.data.token);
                })
                .catch((error) => reject(error));
        });
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        paddingTop: Platform.OS == 'ios' ? 20 : 0,
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
        flex: 1,
        width: 400,
        height: 200,
    }
});
