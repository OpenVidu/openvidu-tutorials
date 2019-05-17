/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { ScrollView, Button, Alert, Linking, StyleSheet, Text, View, PermissionsAndroid } from 'react-native';

import { OpenVidu } from 'openvidu-browser';
import { RTCView } from './node_modules/openvidu-browser/node_modules/react-native-webrtc';

const OPENVIDU_SERVER_URL = 'https://demos.openvidu.io:4443';
const OPENVIDU_SERVER_SECRET = 'MY_SECRET';

type Props = {};
export default class App extends Component<Props> {
    constructor(props) {
        super(props);

        this.state = {
            mySessionId: '5552200',
            myUserName: 'Participant' + Math.floor(Math.random() * 100),
            session: undefined,
            mainStreamManager: undefined,
            publisher: undefined,
            subscribers: [],
            role: 'PUBLISHER',
        };
    }

    componentDidMount() {
        this.requestCameraPermission();
        this.joinSession();
    }

    componentWillUnmount() {
        this.leaveSession();
    }

    async requestCameraPermission() {
        try {
            const camera = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
                title: 'Camera Permission',
                message: 'OpenVidu needs access to your camera',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            });
            const audio = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
                title: 'Aduio Permission',
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
            () => {
                var mySession = this.state.session;
                // --- 3) Specify the actions when events take place in the session ---

                // On every new Stream received...
                mySession.on('streamCreated', (event) => {
                    // Subscribe to the Stream to receive it. Second parameter is undefined
                    // so OpenVidu doesn't create an HTML video by its own
                    const subscriber = mySession.subscribe(event.stream, undefined);
                    console.log('streamCreated EVENT', event.stream);
                    var subscribers = this.state.subscribers;
                    subscribers.push(subscriber);
                    // Update the state with the new subscribers
                    this.setState({
                        subscribers: subscribers,
                    });
                });

                // On every Stream destroyed...
                mySession.on('streamDestroyed', (event) => {
                    // Remove the stream from 'subscribers' array
                    this.deleteSubscriber(event.stream.streamManager);
                });

                // --- 4) Connect to the session with a valid user token ---
                // 'getToken' method is simulating what your server-side should do.
                // 'token' parameter should be retrieved and returned by your own backend
                this.getToken()
                    .then((token) => {
                        // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
                        // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
                        mySession
                            .connect(token, { clientData: this.state.myUserName })
                            .then(() => {
                                console.log('SESSION CONECTADA');
                                // --- 5) Get your own camera stream ---
                                if (this.state.role !== 'SUBSCRIBER') {
                                    // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
                                    // element: we will manage it on our own) and with the desired properties
                                    let publisher = this.OV.initPublisher(undefined, {
                                        audioSource: undefined, // The source of audio. If undefined default microphone
                                        videoSource: undefined, // The source of video. If undefined default webcam
                                        publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                                        publishVideo: true, // Whether you want to start publishing with your video enabled or not
                                        resolution: '640x480', // The resolution of your video
                                        frameRate: 30, // The frame rate of your video
                                        insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
                                        mirror: false, // Whether to mirror your local video or not
                                    });

                                    console.log('init publisher OK ', publisher);

                                    // --- 6) Publish your stream ---

                                    // Set the main video in the page to display our webcam and store our Publisher
                                    this.setState({
                                        mainStreamManager: publisher,
                                        publisher: publisher,
                                    });
                                    mySession.publish(publisher);
                                }
                                
                            })
                            .catch((error) => {
                                console.log('There was an error connecting to the session:', error.code, error.message);
                            });
                    })
                    .catch((error) => console.log('Error', error));
            },
        );
    }

    deleteSubscriber(streamManager) {
        setTimeout(() => {
            let subscribers = this.state.subscribers;
            const index = subscribers.indexOf(streamManager, 0);
            if (index > -1) {
                subscribers.splice(index, 1);
                this.setState({
                    subscribers: subscribers,
                });
            }
        });
    }

    leaveSession() {
        // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

        const mySession = this.state.session;

        if (mySession) {
            mySession.disconnect();
        }

        // Empty all properties...
        this.OV = null;
        this.setState({
            session: undefined,
            subscribers: [],
            mySessionId: '5552200',
            myUserName: 'Participant' + Math.floor(Math.random() * 100),
            mainStreamManager: undefined,
            publisher: undefined,
        });
    }

    addVideoElement(video) {
        this.state.mainStreamManager.addVideoElement(video);
    }

    toggleCamera(){
        this.state.mainStreamManager.stream.getMediaStream().getVideoTracks()[0]._switchCamera();
    }

    render() {

        return (
            <ScrollView>
                {this.state.mainStreamManager ? (
                    <View>
                        <Text>Local Stream</Text>
                        <RTCView zOrder={0}  objectFit="cover"
                            ref={(rtcVideo) => {
                                if (!!rtcVideo) {
                                    this.addVideoElement(rtcVideo);
                                }
                            }}
                            style={styles.selfView}
                        />
                        <Button
                            onLongPress={() => this.toggleCamera()}
                            onPress={() => this.toggleCamera()} 
                            title="Toggle Camera"
                            color="#841584"
                            />
                    </View>
                ) : (
                    <View >
                        <Text>No video local</Text>
                    </View>
                )}

                <View style={styles.contentContainer}>
                    {this.state.subscribers.map((item, index) => {
                        if(!!item){
                            return (
                                <RTCView zOrder={0} key={index} objectFit="cover" style={styles.selfView}  ref={(rtcVideo) => {
                                    if (!!rtcVideo){
                                        item.addVideoElement(rtcVideo);
                                    }
                                }} />
                            )
                        }
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
     *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
     *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
     *   3) The token must be consumed in Session.connect() method
     */

    getToken() {
        return this.createSession(this.state.mySessionId)
            .then((sessionId) => this.createToken(sessionId))
            .catch((error) => console.log(error));
    }

    createSession(sessionId) {
        return new Promise((resolve) => {
            var body = JSON.stringify({ customSessionId: sessionId, role: this.state.role });
            var data = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                    'Content-Type': 'application/json',
                },
                body: body,
            };

            fetch(OPENVIDU_SERVER_URL + '/api/sessions', data)
                .then((response) => {
                    console.log('CREATE SESION', response);
                    resolve(sessionId);
                })
                .catch((error) => {
                    console.log('EEEEERROR');
                    console.log(error);
                    if (error.status === 409) {
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
        console.log('CREATE TOKEN');
        return new Promise((resolve, reject) => {
            var body = JSON.stringify({ session: sessionId, role: this.state.role });
            var data = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
                    'Content-Type': 'application/json',
                },
                body: body,
            };
            fetch(OPENVIDU_SERVER_URL + '/api/tokens', data)
                .then((response) => {
                    console.log('TOKEN', response);
                    return response.json();
                })
                .then((resp) => resolve(resp.token))
                .catch((error) => console.error(error));
        });
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selfView: {
        width: 200,
        height: 200,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'transparent',
       
    },
});
