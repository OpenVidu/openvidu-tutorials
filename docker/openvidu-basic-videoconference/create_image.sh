#!/bin/bash

docker build --pull --no-cache --rm=true --build-arg OPENVIDU_TUTORIALS_VERSION="$1" -t openvidu/openvidu-basic-videoconference .
docker tag openvidu/openvidu-basic-videoconference:latest openvidu/openvidu-basic-videoconference:$1