#!/bin/bash
if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./create_images.sh X.Y.Z\""
    exit 1
fi

docker build --pull --no-cache --rm=true -t openvidu/openvidu-demo-proxy:"$1" .