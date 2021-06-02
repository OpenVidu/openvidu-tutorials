#!/bin/bash

docker build --pull --no-cache --rm=true --build-arg OPENVIDU_TUTORIALS_VERSION="$1" -t openvidu/openvidu-getaroom .
docker tag openvidu/openvidu-getaroom:latest openvidu/openvidu-getaroom:$1