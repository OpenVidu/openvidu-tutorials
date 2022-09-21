#!/bin/bash
if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./create_image.sh X.Y.Z\""
    exit 1
fi

pushd ../

cp -r ../openvidu-basic-node .

trap 'rm -rf ./openvidu-basic-node' ERR

docker build --pull --no-cache --rm=true -f docker/Dockerfile -t openvidu/openvidu-getaroom:"${1}" .

rm -rf ./openvidu-basic-node