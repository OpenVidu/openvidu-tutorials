FROM node:16-alpine3.16

# Copy openvidu-basic-node
COPY ./openvidu-basic-node /opt/openvidu-basic-node

# Install openvidu-basic-node dependencies
RUN npm --prefix /opt/openvidu-basic-node install

# Copy static files to openvidu-basic-node
RUN mkdir -p /opt/openvidu-basic-node/public
COPY ./web /opt/openvidu-basic-node/public

WORKDIR /opt/openvidu-basic-node

COPY docker/entrypoint.sh .

ENTRYPOINT [ "./entrypoint.sh" ]