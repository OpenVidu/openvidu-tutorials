#!/bin/sh

if [ -n "${OPENVIDU_APPLICATION_SERVER_URL}" ]; then
    # Replace OPENVIDU_APPLICATION_SERVER_URL at frontend app
    sed -i \
        "s|var APPLICATION_SERVER_URL = \"http://localhost:5000/\";|var APPLICATION_SERVER_URL = \"${OPENVIDU_APPLICATION_SERVER_URL}/\";|" \
        public/app.js
fi

exec node index.js "$*"