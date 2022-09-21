FROM node:16-alpine3.16

# Copy openvidu-basic-node
COPY . /opt/openvidu-basic-node

# Install openvidu-basic-node dependencies
RUN npm --prefix /opt/openvidu-basic-node install

WORKDIR /opt/openvidu-basic-node

ENTRYPOINT [ "node", "index.js" ]