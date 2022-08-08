FROM nginx:1.19.2-alpine

RUN apk update && \
    # apk add wget && \
    rm -rf /var/cache/apk/*

# Install openvidu-js-screen-share
COPY ./web /var/www/openvidu-js-screen-share
RUN chown -R nginx:nginx /var/www/openvidu-js-screen-share

# Nginx conf
COPY ./docker/openvidu-js-screen-share.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
