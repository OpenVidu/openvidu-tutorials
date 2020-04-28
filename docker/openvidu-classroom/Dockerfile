FROM alpine:3.11

ARG OPENVIDU_TUTORIALS_VERSION

RUN apk update && \
    apk add wget && \
    apk add openjdk8-jre && \
    apk add mysql mysql-client && \
    rm -rf /var/cache/apk/*

# Install basic-videoconference
RUN mkdir -p /opt/openvidu-basic-webinar && \
    wget -L -O /opt/classroom-demo.jar \
        "https://github.com/OpenVidu/classroom-demo/releases/download/v${OPENVIDU_TUTORIALS_VERSION}/classroom-demo-${OPENVIDU_TUTORIALS_VERSION}.war"

# Entrypoint
COPY ./entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
