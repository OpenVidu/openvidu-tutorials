#!/bin/bash
if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./create_image.sh X.Y.Z\""
    exit 1
fi

pushd ../

docker build --pull --no-cache --rm=true -f docker/Dockerfile -t "$1" .