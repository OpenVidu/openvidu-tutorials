
FROM maven:3.6.3 as build
WORKDIR /openvidu-ipcameras
COPY ./pom.xml pom.xml
COPY ./src/main src/main

RUN mvn clean install
RUN mvn -o package

FROM alpine:3.11

RUN apk update && \
    apk add openjdk11-jre && \
    rm -rf /var/cache/apk/*

# Install basic-webinar
RUN mkdir -p /opt/openvidu-ipcameras
COPY --from=build /openvidu-ipcameras/target/openvidu-ipcameras-*.jar /opt/openvidu-ipcameras/openvidu-ipcameras.jar
# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh



