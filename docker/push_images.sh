#!/bin/bash

if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./push_images.sh 2.17.0\""
    exit 1
fi

for folder in */ ; do
    folder=${folder%/}
    echo
    echo "Pushing image openvidu/$folder:$1"
    echo
    cd "$folder"  || exit
    docker push openvidu/$folder:$1
    docker push openvidu/$folder:latest
    cd ..
done