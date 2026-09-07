FROM node:16-alpine3.16

COPY . ./openvidu-react

WORKDIR /openvidu-react


# Install openvidu-react dependencies and build it
RUN npm install && \
	npm run build && \
	cp -r ./build/ ./openvidu-basic-node/public

# Copy openvidu-basic-node
RUN cp -r ./openvidu-basic-node /opt/openvidu-basic-node && \
	rm -rf ../openvidu-react

# Install openvidu-basic-node dependencies
RUN npm --prefix /opt/openvidu-basic-node install

WORKDIR /opt/openvidu-basic-node

COPY docker/entrypoint.sh .

ENTRYPOINT [ "./entrypoint.sh" ]