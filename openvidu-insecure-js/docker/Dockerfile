FROM nginx:1.19.2-alpine

RUN apk update && \
    # apk add wget && \
    rm -rf /var/cache/apk/*

# Install openvidu-js
COPY ./web /var/www/openvidu-js
RUN chown -R nginx:nginx /var/www/openvidu-js

# Nginx conf
COPY ./docker/openvidu-js.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
