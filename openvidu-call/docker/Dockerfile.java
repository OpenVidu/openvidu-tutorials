# Build OpenVidu Call for production
FROM node:lts-alpine3.16 as openvidu-call-build

WORKDIR /openvidu-call

ARG BASE_HREF=/

COPY . .

RUN npm install --location=global npm

# Build OpenVidu Call frontend
RUN rm openvidu-call-front/package-lock.json && \
    # Install frontend dependencies and build it for production
    cd openvidu-call-front && npm install && \
    npm run prod:build-java ${BASE_HREF} && \
    cd ../ && rm -rf openvidu-call-front

FROM maven

WORKDIR /opt/openvidu-call

COPY --from=openvidu-call-build /openvidu-call/openvidu-call-back-java .

# Install backend dependencies and build it for production
RUN mvn clean install package

# Entrypoint
COPY docker/java-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN cat /usr/local/bin/entrypoint.sh
RUN apt-get install curl && \
    chmod +x /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]

