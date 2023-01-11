FROM node:16-alpine3.16

COPY . ./openvidu-angular

WORKDIR /openvidu-angular


# Install openvidu-angular dependencies and build it for production
RUN npm install && \
	npm run build:prod

# Copy openvidu-basic-node
RUN cp -r ./openvidu-basic-node /opt/ && \
	rm -rf ../openvidu-angular


# Install openvidu-basic-node dependencies
RUN npm --prefix /opt/openvidu-basic-node install

WORKDIR /opt/openvidu-basic-node

COPY docker/entrypoint.sh .

ENTRYPOINT [ "./entrypoint.sh" ]