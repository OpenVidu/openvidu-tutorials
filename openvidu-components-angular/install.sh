#!/bin/bash

TUTORIALS=(
  'openvidu-additional-panels'
  'openvidu-admin-dashboard'
  'openvidu-custom-activities-panel'
  'openvidu-custom-chat-panel'
  'openvidu-custom-lang'
  'openvidu-custom-layout'
  'openvidu-custom-panels'
  'openvidu-custom-participant-panel-item'
  'openvidu-custom-participant-panel-item-elements'
  'openvidu-custom-participants-panel'
  'openvidu-custom-stream'
  'openvidu-custom-toolbar'
  'openvidu-custom-ui'
  'openvidu-toggle-hand'
  'openvidu-toolbar-buttons'
  'openvidu-toolbar-panel-buttons'
  'openvidu-demo-app/frontend'
)

for tutorial in "${TUTORIALS[@]}"
do
  echo "Installing modules in $tutorial, please wait ..."

  pushd "$tutorial" || exit 1

  # rm package-lock.json
  npm version 3.4.0
  npm i openvidu-components-angular@latest
  popd || exit 1

done
