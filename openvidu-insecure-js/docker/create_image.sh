#!/bin/bash

pushd ../

docker build -f docker/Dockerfile -t openvidu/openvidu-js-demo .
docker tag openvidu/openvidu-js-demo:latest openvidu/openvidu-js-demo:2.18.0