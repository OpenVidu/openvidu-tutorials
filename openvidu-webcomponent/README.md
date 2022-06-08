[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![OpenVidu Tests](https://github.com/OpenVidu/openvidu/actions/workflows/openvidu-ce-test.yml/badge.svg)](https://github.com/OpenVidu/openvidu/actions/workflows/openvidu-ce-test.yml)
[![Documentation Status](https://readthedocs.org/projects/openvidu/badge/?version=stable)](https://docs.openvidu.io/en/stable/?badge=stable)
[![Docker badge](https://img.shields.io/docker/pulls/openvidu/openvidu-server-kms.svg)](https://hub.docker.com/r/openvidu/openvidu-server-kms)
[![Support badge](https://img.shields.io/badge/support-sof-yellowgreen.svg)](https://openvidu.discourse.group/)

[![][OpenViduLogo]](http://openvidu.io)

openvidu-webcomponent
===

Visit [docs.openvidu.io/en/stable/tutorials/openvidu-webcomponent/](http://docs.openvidu.io/en/stable/tutorials/openvidu-webcomponent/)

[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120


### How to build it

First of all, the webcomponent is built from openvidu-call so you must to clone this repository first:

```bash
$ git clone https://github.com/OpenVidu/openvidu-call.git
```
And also clone openvidu-tutorials in the same path with: 

```bash
$ git clone https://github.com/OpenVidu/openvidu-tutorials.git
```

Once done, you will ned to go to the angular project with:

```bash
$ cd <your-path>/openvidu-call/front/openvidu-call/
```
Install npm dependencies with:

```bash
$ npm install
```

After that, the following command will generate the necessary artefacts and it'll copy them automatically into the openvidu-webcomponent tutorial:

```bash
$ npm run build:openvidu-webcomponent
```
