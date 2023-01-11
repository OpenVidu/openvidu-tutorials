#!/bin/bash
if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./create_image.sh <IMAGE_NAME>\""
    exit 1
fi

pushd ../

cp -r ../openvidu-basic-node .

trap 'rm -rf ./openvidu-basic-node' ERR

docker build --pull --no-cache --rm=true -f docker/Dockerfile -t "$1" .

rm -rf ./openvidu-basic-node