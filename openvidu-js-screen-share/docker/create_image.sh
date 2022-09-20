#!/bin/bash

pushd ../

cp -r ../openvidu-basic-node .

trap 'rm -rf ./openvidu-basic-node' ERR

docker build --pull --no-cache --rm=true -f docker/Dockerfile -t openvidu/openvidu-js-screen-share-demo .
docker tag openvidu/openvidu-js-screen-share-demo:latest openvidu/openvidu-js-screen-share-demo:2.22.0

rm -rf ./openvidu-basic-node