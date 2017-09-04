### openvidu-js-java ###

# Build and package maven project
cd .. && mvn clean compile package

# Copy jar in docker build path
cp target/openvidu-js-java-"$1".jar docker/openvidu-sample-secure.jar



### openvidu-server ###

# Copy openvidu-server project in docker build path except angular-cli project ('frontend' folder)
cd docker
rsync -ax --exclude='**/angular' ../../../openvidu/openvidu-server .

# Build and package maven project
cd openvidu-server && mvn clean compile package -DskipTests=true

# Copy openvidu.server.jar in docker build path
cp target/openvidu-server-"$1".jar ../openvidu-server.jar



### Build Docker container and remove unwanted files ###

cd ..

docker build -t openvidu/basic-webinar-demo .

rm ./openvidu-sample-secure.jar
rm ./openvidu-server.jar
rm -rf ./openvidu-server
