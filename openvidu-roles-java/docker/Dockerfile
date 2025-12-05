
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /basic-webinar
COPY ./pom.xml pom.xml
COPY ./src/main src/main

RUN mvn clean install -DskipTests
RUN mvn -o package -DskipTests

FROM eclipse-temurin:25-jre-alpine

RUN apk update && \
    rm -rf /var/cache/apk/*

# Install basic-webinar
RUN mkdir -p /opt/openvidu-basic-webinar
COPY --from=build /basic-webinar/target/openvidu-roles-java-*.jar /opt/openvidu-basic-webinar/openvidu-basic-webinar.jar
# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh



