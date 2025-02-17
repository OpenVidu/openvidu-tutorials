#!/bin/bash

TUTORIALS=(
  '../openvidu-additional-panels'
  '../openvidu-admin-dashboard'
  '../openvidu-custom-activities-panel'
  '../openvidu-custom-chat-panel'
  '../openvidu-custom-layout'
  '../openvidu-custom-panels'
  '../openvidu-custom-participant-panel-item'
  '../openvidu-custom-participant-panel-item-elements'
  '../openvidu-custom-participants-panel'
  '../openvidu-custom-stream'
  '../openvidu-custom-toolbar'
  '../openvidu-custom-ui'
  '../openvidu-toggle-hand'
  '../openvidu-toolbar-buttons'
  '../openvidu-toolbar-panel-buttons'
)
# Initialize counters for successful and failed tests
SUCCESS=0
FAILURE=0

for tutorial in "${TUTORIALS[@]}"
do
  echo "Processing $tutorial..."

  if [ -d "$tutorial" ]; then

    cd "$tutorial" || { echo "Cannot enter directory $tutorial"; exit 1; }
    rm -rf node_modules
    # rm -f package-lock.json
    npm install openvidu-components-angular@latest

    # Check if port 5080 is in use and kill the process if necessary
    PORT_IN_USE=$(lsof -i :5080 | grep LISTEN)
    if [ -n "$PORT_IN_USE" ]; then
      echo "Port 5080 is in use. Killing the process..."
      kill -9 $(lsof -ti :5080)
    fi

    # Start the application
    echo "Starting the application in $tutorial..."
    npm run start &
    APP_PID=$!

    # Wait some time for the application to start
    sleep 20

    # Run the test
    echo "Running test for $tutorial..."
    node ../test/test.js "$tutorial"

    # Check if the test failed
    if [ $? -eq 1 ]; then
      echo "ERROR!! Test failed for $tutorial"
      ((FAILURE++))
    else
      ((SUCCESS++))
    fi


    echo "Stopping the application in $tutorial..."
    kill $APP_PID
    wait $APP_PID 2>/dev/null # Wait for the process to stop before continuing

    cd - || { echo "Cannot return to previous directory"; exit 1; }
  else
    echo "Directory $tutorial does not exist."
  fi
done

echo "Summary:"
echo "Successful tests: $SUCCESS"
echo "Failed tests: $FAILURE"

# Exit with an error code if there are failed tests
if [ $FAILURE -gt 0 ]; then
  exit 1
fi
