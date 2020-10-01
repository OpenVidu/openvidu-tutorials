#!/bin/bash
pushd ../

docker build -f docker/Dockerfile -t openvidu/openvidu-getaroom-demo .
docker tag openvidu/openvidu-getaroom-demo:latest openvidu/openvidu-getaroom-demo:2.15.0