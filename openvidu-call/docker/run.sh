#!/usr/bin/env bash

if [[ -z "$1" ]] || [[ -z "$2" ]]; then
    if [[ -z "$1" ]]; then
        echo "RELEASE_VERSION argument is required" 1>&2
    fi
    if [[ -z "$2" ]]; then
        echo "BRANCH_NAME argument is required" 1>&2
    fi
    echo "Example of use: ./run.sh 2.14.0 master" 1>&2
    exit 1
fi

RELEASE_VERSION=$1
BRANCH_NAME=$2
CALL_BASE_HREF=/
DEMOS_BASE_HREF=/openvidu-call/

printf '\n'
printf '\n     -------------------------------------------------------------'
printf '\n       Installing OpenVidu Call with the following arguments:'
printf '\n'
printf '\n          Call container tag:  openvidu/openvidu-call:%s'  "${RELEASE_VERSION}"
printf '\n          Demos container tag:  openvidu/openvidu-call-demos:%s'  "${RELEASE_VERSION}"
printf '\n          Branch to build:  %s'  "${BRANCH_NAME}"
printf '\n     -------------------------------------------------------------'
printf '\n'

docker build -f prod.dockerfile -t openvidu/openvidu-call:${RELEASE_VERSION} --build-arg BRANCH_NAME=${BRANCH_NAME} --build-arg BASE_HREF=${CALL_BASE_HREF} .
docker build -f prod.dockerfile -t openvidu/openvidu-call:${RELEASE_VERSION}-demos --build-arg BRANCH_NAME=${BRANCH_NAME} --build-arg BASE_HREF=${DEMOS_BASE_HREF} .

printf '\n'
printf '\n     Pushing containers to OpenVidu DockerHub'
printf '\n'

docker push openvidu/openvidu-call:${RELEASE_VERSION}
docker push openvidu/openvidu-call:${RELEASE_VERSION}-demos
