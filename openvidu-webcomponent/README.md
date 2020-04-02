[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Documentation Status](https://readthedocs.org/projects/openviduio-docs/badge/?version=stable)](https://docs.openvidu.io/en/stable/?badge=stable)
[![Docker badge](https://img.shields.io/docker/pulls/openvidu/openvidu-server-kms.svg)](https://hub.docker.com/r/openvidu/openvidu-server-kms)
[![Support badge](https://img.shields.io/badge/support-sof-yellowgreen.svg)](https://groups.google.com/forum/#!forum/openvidu)

[![][OpenViduLogo]](http://openvidu.io)

openvidu-webcomponent
===

Visit [openvidu.io/docs/tutorials/openvidu-webcomponent/](http://openvidu.io/docs/tutorials/openvidu-webcomponent/)

[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120


### How to build a webcomponent

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

After that the following command will generate and copy the webcomponent files into a openvidu-webcomponent project:

```bash
$ npm run build:openvidu-webcomponent
```
