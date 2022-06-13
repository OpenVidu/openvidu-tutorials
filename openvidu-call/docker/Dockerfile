# Build OpenVidu Call for production
FROM node:lts-alpine3.16 as openvidu-call-build

WORKDIR /openvidu-call

ARG BASE_HREF=/

COPY . .

# Build OpenVidu call
RUN rm openvidu-call-front/package-lock.json && \
    # Install openvidu-call-front dependencies and build it for production
    cd openvidu-call-front && npm install && \
    cd ../ && npm run build-prod ${BASE_HREF} --prefix openvidu-call-front && \
    rm -rf openvidu-call-front

FROM node:lts-alpine3.16

WORKDIR /opt/openvidu-call

COPY --from=openvidu-call-build /openvidu-call/openvidu-call-back .

# Install openvidu-call-back dependencies and build it for production
RUN npm install && \
    npm run build

# Entrypoint
COPY docker/entrypoint.sh /usr/local/bin
RUN apk add curl && \
    chmod +x /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]
