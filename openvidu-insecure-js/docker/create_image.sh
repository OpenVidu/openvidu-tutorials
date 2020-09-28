#!/bin/bash

pushd ../

docker build -f docker/Dockerfile -t openvidu/openvidu-insecure-js-demo .
docker tag openvidu/openvidu-insecure-js-demo:latest openvidu/openvidu-insecure-js-demo:2.15.0