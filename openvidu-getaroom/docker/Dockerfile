FROM nginx:1.19.2-alpine

RUN apk update && \
    # apk add wget && \
    rm -rf /var/cache/apk/*

# Install basic-videoconference
COPY ./web /var/www/openvidu-getaroom
RUN chown -R nginx:nginx /var/www/openvidu-getaroom

# Nginx conf
COPY ./docker/openvidu-getaroom.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
