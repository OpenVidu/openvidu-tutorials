FROM node:16-alpine3.16

# Copy openvidu-basic-node
COPY ./openvidu-basic-node /var/www/openvidu-basic-node

# Install openvidu-basic-node dependencies
RUN npm --prefix /var/www/openvidu-basic-node install

# Copy static files to openvidu-basic-node
RUN mkdir -p /var/www/openvidu-basic-node/public
COPY ./web /var/www/openvidu-basic-node/public

WORKDIR /var/www/openvidu-basic-node

ENTRYPOINT [ "node", "index.js" ]