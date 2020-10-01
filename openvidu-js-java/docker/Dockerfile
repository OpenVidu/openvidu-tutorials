
FROM maven:3.6.3 as build
WORKDIR /basic-webinar
COPY ./pom.xml pom.xml
COPY ./src/main src/main

RUN mvn clean install
RUN mvn -o package

FROM alpine:3.11

RUN apk update && \
    apk add openjdk8-jre && \
    rm -rf /var/cache/apk/*

# Install basic-webinar
RUN mkdir -p /opt/openvidu-basic-webinar
COPY --from=build /basic-webinar/target/openvidu-js-java-*.jar /opt/openvidu-basic-webinar/openvidu-basic-webinar.jar
# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh



