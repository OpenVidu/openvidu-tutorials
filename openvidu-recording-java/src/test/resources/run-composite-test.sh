#!/bin/bash

##################################################################################################
#   This script automatically builds and launches e2e tests for openvidu-recording-java application
#
#   Prerequisites:
#   - Have maven installed in the host machine (sudo apt-get install maven)
#   - Have KMS installed in the host machine (https://docs.openvidu.io/en/stable/deployment/deploying-ubuntu/#1-install-kms)
#   - Run this command to configure KMS with current user (sudo sed -i "s/DAEMON_USER=\"kurento\"/DAEMON_USER=\"${USER}\"/g" /etc/default/kurento-media-server)
#   - Store and run this script inside a folder with write and execute permissions for the current user
##################################################################################################


CURRENT_PATH=$PWD


### Check for write permissions in current path with current user
if [ ! -w $CURRENT_PATH ]; then
  echo "User does not have write permissions in this path"
  exit 1
fi


### Check that no openvidu-server or openvidu-recording-java are already running
if nc -z localhost 4443; then
  echo "ERROR launching openvidu-server. Port 4443 is already occupied"
  echo "You may kill all openvidu processes before running the script with this command: $ sudo kill -9 \$(ps aux | grep openvidu-recording-java | awk '{print \$2}')"
  exit 1
fi
if nc -z localhost 5000; then
  echo "ERROR launching openvidu-recording-java. Port 5000 is already occupied"
  echo "You may kill all openvidu processes before running the script with this command: $ sudo kill -9 \$(ps aux | grep openvidu-recording-java | awk '{print \$2}')"
  exit 1
fi


### Delete repo folders if they exist
rm -rf openvidu
rm -rf openvidu-tutorials


### Init KMS as local user
sudo service kurento-media-server restart


### Clone projects
git clone https://github.com/OpenVidu/openvidu-tutorials.git || exit 1
git clone https://github.com/OpenVidu/openvidu.git || exit 1


### Launch openvidu-server in the background
cd $CURRENT_PATH/openvidu
mvn -DskipTests=true clean -DskipTests=true compile -DskipTests=true install || exit 1
cd $CURRENT_PATH/openvidu/openvidu-server
mvn package -Dopenvidu.recording=true -Dopenvidu.recording.path=$CURRENT_PATH/recordings exec:java &> $CURRENT_PATH/openvidu-server.log &


### Launch openvidu-recording-java app in the background
cd $CURRENT_PATH/openvidu-tutorials/openvidu-recording-java
mvn package -DskipTests=true exec:java &> $CURRENT_PATH/openvidu-recording-java.log &


### Wait for both processes
echo "Waiting openvidu-recording-java app to launch on 5000"
while ! nc -z localhost 5000; do
  sleep 1
  echo "Waiting..."
done
echo "openvidu-recording-java app ready"

echo "Waiting openvidu-server to launch on 4443"
while ! nc -z localhost 4443; do
  sleep 1
  echo "Waiting..."
done
echo "openvidu-server ready"


### Launch e2e test in the foreground
mvn -Dtest=AppTestE2e -DAPP_URL=https://localhost:5000/ -DOPENVIDU_URL=https://localhost:4443/ -DOPENVIDU_SECRET=MY_SECRET -DNUMBER_OF_ATTEMPTS=30 -DRECORDING_DURATION=5 -DDURATION_THRESHOLD=5 -DRECORDING_PATH=$CURRENT_PATH/recordings test
