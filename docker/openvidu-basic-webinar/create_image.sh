#!/bin/bash

docker build --build-arg OPENVIDU_TUTORIALS_VERSION="$1" -t openvidu/openvidu-basic-webinar .