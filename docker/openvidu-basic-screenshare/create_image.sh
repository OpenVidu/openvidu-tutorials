#!/bin/bash

docker build --pull --no-cache --rm=true --build-arg OPENVIDU_TUTORIALS_VERSION="$1" -t openvidu/openvidu-basic-screenshare .
docker tag openvidu/openvidu-basic-screenshare:latest openvidu/openvidu-basic-screenshare:$1
