#!/bin/sh

[ ! -z "${OPENVIDU_URL}" ] && echo "OPENVIDU_URL: ${OPENVIDU_URL}" || echo "OPENVIDU_URL: default"
[ ! -z "${OPENVIDU_SECRET}" ] && echo "OPENVIDU_SECRET: ${OPENVIDU_SECRET}" || echo "OPENVIDU_SECRET: default"

if [ ! -z "${OPENVIDU_SECRET}" ]; then
    sed -i "s|^OPENVIDU_URL=.*$|OPENVIDU_URL=${OPENVIDU_URL}|" /var/www/openvidu-basic-node/.env
fi

if [ ! -z "${OPENVIDU_SECRET}" ]; then
    sed -i "s/^OPENVIDU_SECRET=.*$/OPENVIDU_SECRET=${OPENVIDU_SECRET}/" /var/www/openvidu-basic-node/.env
fi

# Run openvidu-basic-node
CONFIG=/var/www/openvidu-basic-node/.env node /var/www/openvidu-basic-node/index.js > /var/log/nginx/openvidu-basic-node.log &

# Run nginx
nginx -g "daemon on;"

# Show logs
tail -f /var/log/nginx/*.log
