FROM node:16-alpine3.16

# Copy openvidu-roles-node
COPY . /opt/openvidu-roles-node

# Install openvidu-roles-node dependencies
RUN npm --prefix /opt/openvidu-roles-node install

WORKDIR /opt/openvidu-roles-node

COPY docker/entrypoint.sh .

ENTRYPOINT [ "./entrypoint.sh" ]