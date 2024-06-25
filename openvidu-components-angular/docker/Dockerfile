FROM node:18.13.0-alpine3.17

ARG tutorial_name

COPY ./$tutorial_name ./$tutorial_name

WORKDIR /$tutorial_name

# Install openvidu-angular dependencies and build it for production
RUN npm install -g npm && \
	npm install && \
	npm run build:prod

# Copy openvidu-basic-node
RUN cp -r ./openvidu-basic-node /opt/ && \
	rm -rf ../$tutorial_name

# Install openvidu-basic-node dependencies
RUN npm --prefix /opt/openvidu-basic-node install

WORKDIR /opt/openvidu-basic-node

COPY docker/entrypoint.sh .

ENTRYPOINT [ "./entrypoint.sh" ]