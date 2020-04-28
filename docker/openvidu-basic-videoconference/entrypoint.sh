#!/bin/sh

[ ! -z "${OPENVIDU_URL}" ] && echo "OPENVIDU_URL: ${OPENVIDU_URL}" || echo "OPENVIDU_URL: default"
[ ! -z "${OPENVIDU_SECRET}" ] && echo "OPENVIDU_SECRET: ${OPENVIDU_SECRET}" || echo "OPENVIDU_SECRET: default"

if [ ! -z "${OPENVIDU_URL}" ]; then
    sed -i "s/^var OPENVIDU_SERVER_URL =.*$/var OPENVIDU_SERVER_URL = \"$(echo "${OPENVIDU_URL}" | sed 's#/#\\/#g')\";/" /var/www/openvidu-basic-videoconference/app.js
fi

if [ ! -z "${OPENVIDU_SECRET}" ]; then
    sed -i "s/^var OPENVIDU_SERVER_SECRET =.*$/var OPENVIDU_SERVER_SECRET = \"${OPENVIDU_SECRET}\";/" /var/www/openvidu-basic-videoconference/app.js
fi

# Run nginx
nginx -g "daemon on;"

# Show logs
tail -f /var/log/nginx/*.log
