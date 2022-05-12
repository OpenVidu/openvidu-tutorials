# openvidu-fault-tolerance

This project exemplifies the fault tolerance capabilities of an application making use of an OpenVidu cluster, whether it is an OpenVidu Pro cluster or an OpenVidu Enterprise cluster. It demonstrates how to automatically rebuild any Session affected by a node crash, so final users do not have to perform any action to reconnect to a crashed Session.

## Compile and run the app

This is a SpringBoot application. Prerequisites:

| Dependency    | Check version   | Install                                 |
| ------------- | --------------- |---------------------------------------- |
| Java 11 JDK    | `java -version` | `sudo apt-get install -y openjdk-11-jdk` |
| Maven         | `mvn -v`        | `sudo apt-get install -y maven`         |

To compile and run the app:

```
git clone git@github.com:OpenVidu/openvidu-tutorials.git
cd openvidu-tutorials/openvidu-fault-tolerance
mvn clean package
java -jar target/openvidu-fault-tolerance*.jar --openvidu.url=OPENVIDU_PRO_DOMAIN --openvidu.secret=OPENVIDU_SECRET
```

### Example
- `OPENVIDU_PRO_DOMAIN` = `https://example-openvidu.io`
- `OPENVIDU_SECRET` = `MY_SECRET`
```
git clone git@github.com:OpenVidu/openvidu-tutorials.git
cd openvidu-tutorials/openvidu-fault-tolerance
mvn clean package
java -jar target/openvidu-fault-tolerance*.jar --openvidu.url=https://example-openvidu.io --openvidu.secret=MY_SECRET
```

## Test the reconnection capabilities

### Media Node failure

A Session hosted in a Media Node suffering a crash will be automatically re-created and re-located in a different Media Node, without intervention of the final user. For this to work, the OpenVidu cluster must have at least 2 running Media Nodes. To test the reconnection capabilities of the application:

1. Make sure your OpenVidu cluster has at least 2 different Media Nodes.
2. Connect 2 different users to the same session. They should both send and receive each other's video.
3. Find out in which Media Node the session was located. You can call REST API method [GET Media Nodes](https://docs.openvidu.io/en/stable/reference-docs/REST-API/#get-all-medianodes) to do so.
4. Terminate the Media Node hosting the session.
5. After 3~4 seconds both users will automatically re-join the same session, successfully re-establishing the video streams.

### Master Node failure (OpenVidu Enterprise HA)

A session managed by a Master Node suffering a crash will be automatically re-created and re-located in a different Master Node, without intervention of the final user. For this to work, the OpenVidu Enterprise HA cluster must have at least 2 running Master Nodes. To test the reconnection capabilities of the application:

1. Make sure your OpenVidu cluster has at least 2 different Master Nodes.
2. Connect 2 different users to the same session. They should both send and receive each other's video.
3. Find out in which Master Node the session was located. To do so you will need to consume REST API method [GET Sessions](https://docs.openvidu.io/en/stable/reference-docs/REST-API/#reference-docs/REST-API/#get-all-sessions) directly from inside the Master Node machine. Connect to one of them and consume the REST API using directly openvidu-server-pro URI (`http://localhost:5443`), to skip the proxy that unifies the response from every Master Node. For example with cURL: `curl -X GET http://localhost:5443/openvidu/api/sessions -u OPENVIDUAPP:<YOUR_SECRET>`. The Master Node that returns a non-empty response is the one hosting the session.
4. Terminate the Master Node hosting the session.
5. Users will detect the crash and will rejoin the session automatically, successfully re-establishing the video streams. A very short amount of time will elapse from the detection of the crash and the re-joining to the session.