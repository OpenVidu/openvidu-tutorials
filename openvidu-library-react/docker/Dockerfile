FROM node:16-alpine3.16

COPY . ./openvidu-library-react

WORKDIR /openvidu-library-react


# Install openvidu-library-react dependencies and build it
RUN npm install && \
	npm run build && \
	cp -r ./build/ ./openvidu-basic-node/public

# Copy openvidu-basic-node
RUN cp -r ./openvidu-basic-node /opt/openvidu-basic-node && \
	rm -rf ../openvidu-library-react

# Install openvidu-basic-node dependencies
RUN npm --prefix /opt/openvidu-basic-node install

WORKDIR /opt/openvidu-basic-node

COPY docker/entrypoint.sh .

ENTRYPOINT [ "./entrypoint.sh" ]