FROM eclipse-temurin:25-jdk-noble AS build
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
WORKDIR /openvidu-recording-java
COPY ./pom.xml pom.xml
COPY ./src/main src/main

RUN mvn clean install -DskipTests
RUN mvn -o package -DskipTests

FROM eclipse-temurin:25-jre-noble

RUN apt-get update && \
    rm -rf /var/lib/apt/lists/*

# Install basic-webinar
RUN mkdir -p /opt/openvidu-recording-java
COPY --from=build /openvidu-recording-java/target/openvidu-recording-java-*.jar /opt/openvidu-recording-java/openvidu-recording-java.jar
# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]



