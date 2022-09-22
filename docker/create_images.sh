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

# Build openvidu-js-screenshare-demo
pushd openvidu-js-screen-share/docker || exit 1
./create_image.sh "openvidu/openvidu-js-screen-share-demo:$1"
popd || exit 1

# Build openvidu-js-demo
pushd openvidu-js/docker || exit 1
./create_image.sh "openvidu/openvidu-js-demo:$1"
popd || exit 1

# Build openvidu-roles-demo
pushd openvidu-roles-java/docker || exit 1
./create_image.sh "openvidu/openvidu-roles-java-demo:$1"
popd || exit 1

# Build openvidu-getaroom demo
pushd openvidu-getaroom/docker || exit 1
./create_image.sh "openvidu/openvidu-getaroom-demo:$1"
popd || exit 1

# Build openvidu-classroom-demo
pushd ../classroom-demo/docker || exit 1
./create_image.sh "openvidu/openvidu-classroom-demo:$1"
popd || exit 1

# =======================
# Building Basic application servers
# =======================
pushd openvidu-basic-node/docker || exit 1
./create_image.sh "openvidu/openvidu-basic-node-demo:$1"
popd || exit 1

popd || exit 1

# =======================
# Building Demos Proxy
# =======================
pushd openvidu-demo-proxy || exit 1
./create_image.sh "$1"
popd || exit 1
