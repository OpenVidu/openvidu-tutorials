# openvidu-insecure-js

This repository contains a group videoconference sample application implemented using OpenVidu. This application is a SPA page implemented in plain JavaScript (without any JavaScript framework).

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
git clone https://github.com/OpenVidu/openvidu-sample-basic-plainjs
</pre>

First, you need an http web server installed in your development computer to execute the sample application. If you have node.js installed in your development machine, you can use [http-server] to serve application files.(https://github.com/indexzero/http-server). It can be installed with:

<pre>
npm install http-server -g
</pre>

To execute the sample application, execute the following command in the project:

<pre>
cd openvidu-sample-basic-plainjs
http-server ./web
</pre>

If you are using Docker Toolbox for Windows or Mac, you need to modify the sample application code. You have to change the following line in the file `web/app.js`:

<pre>
openVidu = new OpenVidu("wss://127.0.0.1:8443/");
</pre>

You have to change `127.0.0.1` with the IP of the OpenVidu Development Server obtained in the previous step.

Then you can go to `http://127.0.0.1:8080` to execute the sample application. 

As you can see, the user name and session is filled automatically in the form to make easier testing the app. 

If you open `http://127.0.0.1:8080` in two tabs, you can simulate two users talking together. You can open as tabs as you want, but you need a very powerful development machine to test 3 or more users.

For now, it is not possible use the sample application from a different computer.

## Sample application code

This application is very simple. It has only 4 files:
* `OpenVidu.js`: OpenVidu client. You don't have to manipulate this file. 
* `app.js`: Sample application main JavaScritp file. You can manipulate this file to adapt it to your necesities.
* `index.html`: HTML file. It contains the HTML code for the form to connect to a videoconference and for the videoconference itself. You can manipulate this file to adapt it to your necesities.
* `style.css`: Some CSS classes to style HTML. You can manipulate this file to adapt it to your necesities.


