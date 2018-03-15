# Build and package openvidu-js-java maven project
cd .. && mvn clean compile package

# Copy openvidu-js-java.jar in docker build path
cp target/openvidu-js-java-"$1".jar ./docker/openvidu-js-java.jar

# Copy compiled openvidu-server.jar
cd ./docker && cp ../../../openvidu/openvidu-server/target/openvidu-server-"$1".jar ./openvidu-server.jar

### Build Docker container and remove unwanted files ###
docker build -t openvidu/basic-webinar-demo .

rm ./openvidu-js-java.jar
rm ./openvidu-server.jar
rm -rf ./openvidu-server
