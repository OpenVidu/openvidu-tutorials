[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Documentation Status](https://readthedocs.org/projects/openviduio-docs/badge/?version=stable)](https://docs.openvidu.io/en/stable/?badge=stable)
[![Docker badge](https://img.shields.io/docker/pulls/openvidu/openvidu-server-kms.svg)](https://hub.docker.com/r/openvidu/openvidu-server-kms)
[![Support badge](https://img.shields.io/badge/support-sof-yellowgreen.svg)](https://groups.google.com/forum/#!forum/openvidu)

[![][OpenViduLogo]](http://openvidu.io)

openvidu-internet-explorer
===

> IE support is a paid feature. Please, contact OpenVidu team through https://openvidu.io/commercial if you are interested

This is an adaptation of [openvidu-insecure-js](https://github.com/OpenVidu/openvidu-tutorials/tree/master/openvidu-insecure-js) application with all necessary changes to work fine on IE 11.

<!-- Visit [docs.openvidu.io/en/stable/tutorials/openvidu-insecure-js/](http://docs.openvidu.io/en/stable/tutorials/openvidu-insecure-js/) -->

OpenVidu Team has been able to bring complete, standards-compliant WebRTC funcionality to Microsoft Internet Explorer desktop browser (v 11). This feature has been released thanks to [Temasys WebRTC Plugin](https://temasys.io/products/plugin/).

To use this tutorial you should follow the next steps:

1) Clone the repo
```bash
git clone https://github.com/OpenVidu/openvidu-tutorials.git
```

2) You will need an http web server installed in your development computer to execute the tutorial. If you have node.js installed, you can use [http-server](https://github.com/indexzero/http-server) to serve application files. It can be installed with:
```bash
sudo npm install -g http-server
```
3) Run openvidu-server as it says [here](https://docs.openvidu.io/en/stable/troubleshooting/#3-i-am-using-windows-to-run-the-tutorials-develop-my-app-anything-i-should-know)

4) Start the tutorial
```bash
http-server openvidu-tutorials/openvidu-internet-explorer/web
```

5) Go to `localhost:8080` to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of openvidu-server when you first try to join a video-call.
If you have problems accepting the certificate you can connect through `127.0.0.1` instead of `localhost`.

First time you use this application **openvidu-internet-explorer** with Internet Explorer, openvidu-browser will present an alert which will allow you to install the Temasys WebTTC plugin. Once the plugin has been installed, your browser is ready to work with OpenVidu.

Internet Explorer (IE) is a highly restrictive browser so we have had several stones on the way. One of these stones has been to get access to client's media devices. **IE does not allow to access our webcam more than once**, so you won't be able to test the app between two different IE tabs. And, of course, you cannot access the same camera with two different browsers.

Another restriction is the ECMAScript version. IE does not fully support a ECMAScript version upper than 5 so this tutorial has been developed with ECMAScript 5. This means that JavaScript code won't have promises and other modern JavaScript features.


[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120
