# Copy compiled openvidu-server.jar
cp ../../../openvidu/openvidu-server/target/openvidu-server-"$1".jar ./openvidu-server.jar

# Copy openvidu-insecure-js web files
cp -a ../web/. ./web/

# Modify OpenVidu Server URL
sed -i 's/url: "https:\/\/" + location\.hostname + ":4443/url: "https:\/\/" + location\.hostname + "/g' ./web/app.js

# Build docker image
docker build -t openvidu/basic-videoconference-demo .

# Delete unwanted files
rm -rf ./web
rm -rf ./openvidu-server
rm openvidu-server.jar
