#!/usr/bin/env bash

if [[ -z "$1" ]]; then
    echo "RELEASE_VERSION argument is required" 1>&2
    echo "Example of use: ./run.sh 2.22.0" 1>&2
    exit 1
fi

RELEASE_VERSION=$1
CALL_BASE_HREF=/
DEMOS_BASE_HREF=/openvidu-call/

printf '\n     -------------------------------------------------------------'
printf '\n       Upgrading dependencies'
printf '\n     -------------------------------------------------------------'
printf '\n'

cd ../openvidu-call-front || exit 1
npm version ${RELEASE_VERSION} || exit 1
npm install openvidu-angular@${RELEASE_VERSION} || exit 1
cd ../openvidu-call-back || exit 1
npm install openvidu-node-client@${RELEASE_VERSION} || exit 1

printf '\n'
printf '\n     -------------------------------------------------------------'
printf '\n       Installing OpenVidu Call with the following arguments:'
printf '\n'
printf '\n          Call container tag:  openvidu/openvidu-call:%s'  "${RELEASE_VERSION}"
printf '\n          Demos container tag:  openvidu/openvidu-call-demos:%s'  "${RELEASE_VERSION}"
printf '\n     -------------------------------------------------------------'
printf '\n'

docker build -f Dockerfile -t openvidu/openvidu-call:${RELEASE_VERSION} --build-arg BASE_HREF=${CALL_BASE_HREF} .
docker build -f Dockerfile -t openvidu/openvidu-call:${RELEASE_VERSION}-demos --build-arg BASE_HREF=${DEMOS_BASE_HREF} .

printf '\n'
printf '\n     Pushing containers to OpenVidu DockerHub'
printf '\n'

docker push openvidu/openvidu-call:${RELEASE_VERSION}
docker push openvidu/openvidu-call:${RELEASE_VERSION}-demos
