#!/bin/bash

pushd ../

cp -r ../openvidu-basic-node .

trap 'rm -rf ./openvidu-basic-node' ERR

docker build -f docker/Dockerfile -t openvidu/openvidu-js-demo .
docker tag openvidu/openvidu-js-demo:latest openvidu/openvidu-js-demo:2.22.0

rm -rf ./openvidu-basic-node