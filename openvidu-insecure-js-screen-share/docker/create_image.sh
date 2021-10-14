#!/bin/bash

pushd ../

docker build -f docker/Dockerfile -t openvidu/openvidu-insecure-js-screen-share-demo .
docker tag openvidu/openvidu-insecure-js-screen-share-demo:latest openvidu/openvidu-insecure-js-screen-share-demo:2.20.0

popd
