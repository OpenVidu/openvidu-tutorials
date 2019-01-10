# Copy compiled openvidu-server.jar
cp ../../../openvidu/openvidu-server/target/openvidu-server-"$1".jar ./openvidu-server.jar

# Copy openvidu-insecure-js web files
cp -a ../web/. ./web/

# Build docker image
docker build -t openvidu/getaroom-demo .

# Delete unwanted files
rm -rf ./web
rm -rf ./openvidu-server
rm openvidu-server.jar
