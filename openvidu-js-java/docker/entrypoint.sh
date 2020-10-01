#!/bin/sh

[ ! -z "${OPENVIDU_URL}" ] && echo "OPENVIDU_URL: ${OPENVIDU_URL}" || echo "OPENVIDU_URL: default"
[ ! -z "${OPENVIDU_SECRET}" ] && echo "OPENVIDU_SECRET: ${OPENVIDU_SECRET}" || echo "OPENVIDU_SECRET: default"
[ ! -z "${SERVER_PORT}" ] && echo "SERVER_PORT: ${SERVER_PORT}" || echo "SERVER_PORT: default"

# Run Application
JAVA_PROPERTIES="-Djava.security.egd=file:/dev/./urandom"
[ ! -z "${OPENVIDU_URL}" ] && JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dopenvidu.url=${OPENVIDU_URL}"
[ ! -z "${OPENVIDU_SECRET}" ] && JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dopenvidu.secret=${OPENVIDU_SECRET}"
[ ! -z "${SERVER_PORT}" ] && JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dserver.port=${SERVER_PORT}"

java ${JAVA_PROPERTIES} -jar /opt/openvidu-basic-webinar/openvidu-basic-webinar.jar
