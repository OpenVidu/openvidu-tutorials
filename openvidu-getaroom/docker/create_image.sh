#!/bin/bash

pushd ../

cp -r ../openvidu-basic-node .

trap 'rm -rf ./openvidu-basic-node' ERR

docker build --pull --no-cache --rm=true -f docker/Dockerfile -t openvidu/openvidu-getaroom-demo .
docker tag openvidu/openvidu-getaroom-demo:latest openvidu/openvidu-getaroom-demo:2.22.0

rm -rf ./openvidu-basic-node