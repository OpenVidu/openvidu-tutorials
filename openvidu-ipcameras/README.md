[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Documentation Status](https://readthedocs.org/projects/openviduio-docs/badge/?version=stable)](https://docs.openvidu.io/en/stable/?badge=stable)
[![Docker badge](https://img.shields.io/docker/pulls/openvidu/openvidu-server-kms.svg)](https://hub.docker.com/r/openvidu/openvidu-server-kms)
[![Support badge](https://img.shields.io/badge/support-sof-yellowgreen.svg)](https://groups.google.com/forum/#!forum/openvidu)

[![][OpenViduLogo]](http://openvidu.io)

openvidu-ipcameras
===

This is a Java application built with Spring Boot 2. It serves a single HTML page (generated with Thymeleaf) where users can see a collection of IP cameras.

## Running the application

You will need:

| Tool          | Check version   | Install                                 |
| ------------- | --------------- |---------------------------------------- |
| Java 8 JDK    | `java -version` | `sudo apt-get install -y openjdk-8-jdk` |
| Maven         | `mvn -v`        | `sudo apt-get install -y maven`         |
| Docker        | `docker -v`     | See [Docker documentation](https://docs.docker.com/install/) |

---

You will need OpenVidu Server running in your development machine. To do so:

1. Run Kurento Media Server Docker container

```
docker run --rm -p 8888:8888 kurento/kurento-media-server:6.12
```

2. Clone, compile and run OpenVidu Server

```
git clone https://github.com/OpenVidu/openvidu.git
cd openvidu
mvn -DskipTests=true clean install # Install global dependencies
cd openvidu-server
mvn exec:java
```

> **NOTE 1**: If you are not running this tutorial in a Linux/OSx system, then you will have to tell OpenVidu Server where is Kurento Media Server available. In Linux and Mac, the Docker container will be accessible through `localhost`, which is the default value in OpenVidu Server, so no changes required. But you must indicate the specific container IP in case you are using Windows and pass it to OpenVidu Server with `mvn -Dkms.uris=[ws://KMS.CONTAINER.IP:8888/kurento] exec:java`

> **NOTE 2**: once you have OpenVidu Server up and running, connect to [`https://localhost:4443`](https://localhost:4443) through your browser to accept its self-signed certificate. If you don't do so, the application will fail

---

Then you can clone, compile and run openvidu-ipcameras application:

```
git clone https://github.com/OpenVidu/openvidu-tutorials.git
cd openvidu-tutorials/openvidu-ipcameras
mvn package exec:java
```

You can now connect to [`https://localhost:8080`](https://localhost:8080) to see the application's only page. Click on "Subscribe to cameras" button to receive all cameras defined in the application's Java code.

[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120