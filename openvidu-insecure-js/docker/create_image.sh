# Copy compiled openvidu-server.jar
cp ../../../openvidu/openvidu-server/target/openvidu-server-"$1".jar ./openvidu-server.jar

# Copy openvidu-insecure-js web files
cp -a ../web/. ./web/

# Modify WebSocket protocol in app.js for allowing both ngrok and localhost connections
sed -i 's/OV\.initSession("wss:\/\/"/OV\.initSession("ws:\/\/"/g' ./web/app.js

# Build docker image
docker build -t openvidu/basic-videoconference-demo .

# Delete unwanted files
rm -rf ./web
rm -rf ./openvidu-server
rm openvidu-server.jar
