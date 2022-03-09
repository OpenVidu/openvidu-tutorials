#!/bin/sh

[[ -z "${OPENVIDU_URL}" ]] && export OPENVIDU_URL=$(curl -s ifconfig.co)
[[ -z "${OPENVIDU_SECRET}" ]] && export OPENVIDU_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

# openvidu-call configuration
cat>/opt/openvidu-call/.env<<EOF
SERVER_PORT=${SERVER_PORT}
OPENVIDU_URL=${OPENVIDU_URL}
OPENVIDU_SECRET=${OPENVIDU_SECRET}
CALL_OPENVIDU_CERTTYPE=${CALL_OPENVIDU_CERTTYPE}
EOF

cd /opt/openvidu-call
nodemon openvidu-call-server.js
