# Copy openvidu-server project except angular-cli project ('frontend' folder)
rsync -ax --exclude='**/angular' --exclude='**/static' ../../../openvidu/openvidu-server .

# Comment root path Basic Authorization in SecurityConfig.java
sed -i 's/\.antMatchers(\"\/\").authenticated()/\/\/.antMatchers(\"\/\").authenticated()/g' ./openvidu-server/src/main/java/io/openvidu/server/security/SecurityConfig.java

# Copy plainjs-demo web files into static folder of openvidu-server project
cp -a ../web/. ./openvidu-server/src/main/resources/static/

# Change port and protocol in URL param of new OpenVidu object in app.js
#sed -i 's/\OV.initSession(\"wss:\/\/\" + location.hostname + \":8443\/\"/OV.initSession(\"wss:\/\/\" + location.hostname + \"\/\"/g' ./openvidu-server/src/main/resources/static/app.js 

# Build and package maven project
cd openvidu-server
mvn clean compile package -DskipTests=true

# Copy .jar in docker build path
cp target/openvidu-server-0.0.1-SNAPSHOT.jar ../openvidu-server.jar

# Build docker image
cd ..
docker build -t openvidu/openvidu-plainjs-demo .

# Delete unwanted files
rm -rf ./openvidu-server
rm openvidu-server.jar
