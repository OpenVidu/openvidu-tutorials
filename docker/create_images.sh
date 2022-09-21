#!/bin/bash
set -eu -o pipefail

if [ $# -eq 0 ]; then
    echo "No version argument provided. Usage: \"./create_images.sh X.Y.Z\""
    exit 1
fi

pushd ..

# =======================
# Building tutorials
# =======================

# Build openvidu-js-screenshare
pushd openvidu-js-screen-share/docker || exit 1
./create_image.sh "$1"
popd || exit 1

# Build openvidu-js-screenshare
pushd openvidu-js/docker || exit 1
./create_image.sh "$1"
popd || exit 1

# Build openvidu-js-screenshare
pushd openvidu-roles-java/docker || exit 1
./create_image.sh "$1"
popd || exit 1

# Build openvidu-js-screenshare
pushd openvidu-getaroom/docker || exit 1
./create_image.sh "$1"
popd || exit 1

# Build openvidu-js-screenshare
pushd ../classroom-demo/docker || exit 1
./create_image.sh "$1"
popd || exit 1

# =======================
# Building Basic application servers
# =======================
pushd openvidu-basic-node/docker || exit 1
./create_image.sh "$1"
popd || exit 1

popd || exit 1

# =======================
# Building Demos Proxy
# =======================
pushd openvidu-demo-proxy || exit 1
./create_image.sh "$1"
popd || exit 1

# Retag images for demos
docker tag openvidu/openvidu-js:"$1" openvidu/openvidu-js-demo:"$1"
docker rmi openvidu/openvidu-js:"$1"

docker tag openvidu/openvidu-js-screen-share:"$1" openvidu/openvidu-js-screen-share-demo:"$1"
docker rmi openvidu/openvidu-js-screen-share:"$1"

docker tag openvidu/openvidu-roles-java:"$1" openvidu/openvidu-roles-java-demo:"$1"
docker rmi openvidu/openvidu-roles-java:"$1"

docker tag openvidu/openvidu-getaroom:"$1" openvidu/openvidu-getaroom-demo:"$1"
docker rmi openvidu/openvidu-getaroom:"$1"

docker tag openvidu/openvidu-basic-node:"$1" openvidu/openvidu-basic-node-demo:"$1"
docker rmi openvidu/openvidu-basic-node:"$1"

