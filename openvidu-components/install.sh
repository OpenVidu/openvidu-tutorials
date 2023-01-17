TUTORIALS=(
  'openvidu-additional-panels'
  'openvidu-admin-dashboard'
  'openvidu-custom-activities-panel'
  'openvidu-custom-chat-panel'
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
)

for tutorial in "${TUTORIALS[@]}"
do
  echo "Installing modules in $tutorial, please wait ..."
  cd $tutorial
  rm package-lock.json && npm install
  cd ..
done