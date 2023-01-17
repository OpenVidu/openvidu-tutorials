#!/bin/bash
if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./create_image.sh <IMAGE_NAME>  <TUTORIAL_NAME>\""
    exit 1
fi

if [ $# -eq 1 ]; then
    echo "No tutorial argument provided. Usage: \"./create_image.sh <IMAGE_NAME> <TUTORIAL_NAME>\""
    exit 1
fi

DIR="../"$2""
if [ -d "$DIR" ]; then

    pushd ../

    cp -r ../openvidu-basic-node ./"$2"

    trap 'rm -rf ./openvidu-basic-node' ERR

    docker build --pull --no-cache --rm=true --build-arg tutorial_name=$2 -f docker/Dockerfile -t "$1" .

    rm -rf ./"$2"/openvidu-basic-node
else
    echo "Error: ${DIR} not found. Can not continue."
    exit 1
fi

