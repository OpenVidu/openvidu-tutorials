#!/bin/bash

pushd ../

docker build -f docker/Dockerfile -t openvidu/openvidu-js-screen-share-demo .
docker tag openvidu/openvidu-js-screen-share-demo:latest openvidu/openvidu-js-screen-share-demo:2.20.0

popd
