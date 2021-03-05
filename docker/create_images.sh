#!/bin/bash

if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./create_images.sh 2.17.0\""
    exit 1
fi

for folder in */ ; do
    echo
    echo "Building image of $folder"
    echo
    cd "$folder"  || exit
    ./create_image.sh $1
    cd ..
done