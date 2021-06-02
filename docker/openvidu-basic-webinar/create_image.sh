#!/bin/bash

docker build --pull --no-cache --rm=true --build-arg OPENVIDU_TUTORIALS_VERSION="$1" -t openvidu/openvidu-basic-webinar .
docker tag openvidu/openvidu-basic-webinar:latest openvidu/openvidu-basic-webinar:$1