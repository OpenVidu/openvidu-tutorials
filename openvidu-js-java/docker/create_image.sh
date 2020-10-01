#!/bin/bash

pushd ../
export SOFTWARE_VERSION=$(grep -oPm1 "(?<=<version>)[^<]+" "pom.xml")
docker build -f docker/Dockerfile -t openvidu/openvidu-basic-webinar-demo .
docker tag openvidu/openvidu-basic-webinar-demo:latest openvidu/openvidu-basic-webinar-demo:${SOFTWARE_VERSION}