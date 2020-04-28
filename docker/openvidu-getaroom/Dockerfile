FROM nginx:1.18.0-alpine

ARG OPENVIDU_TUTORIALS_VERSION

RUN apk update && \
    apk add wget && \
    rm -rf /var/cache/apk/*

# Install basic-videoconference
RUN mkdir -p /var/www/openvidu-getaroom && \
    wget -L -O /tmp/openvidu-tutorials.tar.gz \
        "https://github.com/OpenVidu/openvidu-tutorials/archive/v${OPENVIDU_TUTORIALS_VERSION}.tar.gz" && \
    tar zxf /tmp/openvidu-tutorials.tar.gz -C /tmp && \
    rm /tmp/openvidu-tutorials.tar.gz && \
    cp -r /tmp/openvidu-tutorials*/openvidu-getaroom/web/* /var/www/openvidu-getaroom && \
    rm -r /tmp/openvidu-tutorials* && \
    chown -R nginx:nginx /var/www/openvidu-getaroom

# Nginx conf
COPY ./openvidu-getaroom.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY ./entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
