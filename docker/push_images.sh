#!/bin/bash

if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./push_images.sh 2.17.0\""
    exit 1
fi

# Push images
docker push openvidu/openvidu-js-demo:"$1"
docker push openvidu/openvidu-js-screen-share-demo:"$1"
docker push openvidu/openvidu-roles-java-demo:"$1"
docker push openvidu/openvidu-classroom-demo:"$1"
docker push openvidu/openvidu-getaroom-demo:"$1"
docker push openvidu/openvidu-basic-node-demo:"$1"
docker push openvidu/openvidu-demo-proxy:"$1"
