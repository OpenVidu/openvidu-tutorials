FROM nginx:1.23.1-alpine

RUN apk update && \
    apk add --update npm && \
    rm -rf /var/cache/apk/*

# Install openvidu-js
COPY ./web /var/www/openvidu-js
RUN chown -R nginx:nginx /var/www/openvidu-js

# Copy openvidu-basic-node
COPY ./openvidu-basic-node /var/www/openvidu-basic-node
RUN npm --prefix /var/www/openvidu-basic-node install

# Nginx conf
COPY ./docker/openvidu-js.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
