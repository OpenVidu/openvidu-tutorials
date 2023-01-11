FROM node:16-alpine3.16

# Copy openvidu-recording-node
COPY . /opt/openvidu-recording-node

# Install openvidu-recording-node dependencies
RUN npm --prefix /opt/openvidu-recording-node install

WORKDIR /opt/openvidu-recording-node

COPY docker/entrypoint.sh .

ENTRYPOINT [ "./entrypoint.sh" ]