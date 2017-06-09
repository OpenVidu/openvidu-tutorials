# openvidu-insecure-angular

This repository contains a group videoconference sample application implemented using OpenVidu. This application is a SPA page implemented in [Angular 2](http://angular.io) and was generated with [angular-cli](https://github.com/angular/angular-cli) version 1.0.0-beta.17.

## Start OpenVidu Development Server

To develop a videoconference application with OpenVidu you first have to start an OpenVidu Development Server, that contains all needed services. OpenVidu Development Server is distributed in a single docker image. 

To execute OpenVidu Development Server in your local development computer, you need to have docker software installed. You can [install it on Windows, Mac or Linux](https://docs.docker.com/engine/installation/).

To start OpenVidu Development Server execute the following command (depending on your configuration it is is possible that you need to execute it with 'sudo'):

<pre>
docker run -p 8443:8443 --rm -e KMS_STUN_IP=193.147.51.12 -e KMS_STUN_PORT=3478 openvidu/openvidu-server-kms
</pre>

And then wait to a log trace similar to this:

<pre>
INFO: Started OpenViduServer in 5.372 seconds (JVM running for 6.07)
</pre>

If you have installed Docker Toolbox in Windows or Mac, you need to know the IP address of your docker machine excuting the following command:

<pre>
docker-machine ip default
</pre>

Then, open in your browser and visit URL `https://127.0.0.1:8443` (or if you are using Docker Toolbox in Windows or Mac visit `https://<IP>:8443`). Then, browser will complain about insecure certificate. Please accept the selfsigned certificate as valid.

Now you are ready to execute the sample application.

## Executing sample application

In this repository you have a sample JavaScript application that use OpenVidu Development Server to allow videoconferences  between a group of users. Please clone it with the following command (you need git installed in your development machine):

<pre>
git clone https://github.com/OpenVidu/openvidu-sample-basic-ng2
</pre>

Then, install NPM dependencies with:

<pre>
cd openvidu-sample-basic-ng2
npm install
</pre>

If you obtain an error executing this command, be sure you have installed Node 4 or highe together with NPM 3 or higher.

Then, you execute the development Angular 2 server executing 

<pre>
ng serve
</pre>

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

If you are using Docker Toolbox for Windows or Mac, you need to modify the sample application code. You have to change the following line in the file `src/app/app.component.ts`:

<pre>
this.openVidu = new OpenVidu("wss://127.0.0.1:8443/");
</pre>

You have to change `127.0.0.1` with the IP of the OpenVidu Development Server obtained in the previous step.

Then you can go to `http://localhost:4200/` to use the sample application. 

As you can see, the user name and session is filled automatically in the form to make easier testing the app. 

If you open `http://localhost:4200/` in two tabs, you can simulate two users talking together. You can open as tabs as you want, but you need a very powerful development machine to test 3 or more users.

For now, it is not possible use the sample application from a different computer.

## Troubleshooting

If you click the joing button and nothing happens, check the developer tools log. If you see

<pre>
Chrome: using SDP PlanB
lang.js:234Angular 2 is running in the development mode. Call enableProdMode() to enable the production mode.
Participant.js:32 New local participant undefined, streams opts:  []
jsonrpcclient.js:127 Connecting websocket to URI: wss://127.0.0.1:8443/room
browser.js:38 WebSocket connection to 'wss://127.0.0.1:8443/room' failed: WebSocket opening handshake was canceledws @ browser.js:38WebSocketWithReconnection @ webSocketWithReconnection.js:59JsonRpcClient @ jsonrpcclient.js:125OpenVidu.initJsonRpcClient @ OpenVidu.js:63OpenVidu.connect @ OpenVidu.js:35AppComponent.joinSession @ app.component.ts:46_View_AppComponent1._handle_submit_5_0 @ AppComponent.ngfactory.js:533(anonymous function) @ view.js:403(anonymous function) @ dom_renderer.js:249(anonymous function) @ dom_events.js:26ZoneDelegate.invoke @ zone.js:232onInvoke @ ng_zone_impl.js:43ZoneDelegate.invoke @ zone.js:231Zone.runGuarded @ zone.js:128NgZoneImpl.runInnerGuarded @ ng_zone_impl.js:72NgZone.runGuarded @ ng_zone.js:235outsideHandler @ dom_events.js:26ZoneDelegate.invokeTask @ zone.js:265Zone.runTask @ zone.js:154ZoneTask.invoke @ zone.js:335
</pre>

You have to go to

https://localhost:8443/ or https://127.0.0.1:8443/ and accept the certificate 
