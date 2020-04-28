FROM alpine:3.11

ARG OPENVIDU_TUTORIALS_VERSION

RUN apk update && \
    apk add wget && \
    apk add openjdk8-jre && \
    rm -rf /var/cache/apk/*

# Install basic-videoconference
RUN mkdir -p /opt/openvidu-basic-webinar && \
    wget -L -O /opt/openvidu-js-java.jar \
        "https://github.com/OpenVidu/openvidu-tutorials/releases/download/v${OPENVIDU_TUTORIALS_VERSION}/openvidu-js-java-${OPENVIDU_TUTORIALS_VERSION}.jar"

# Entrypoint
COPY ./entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
