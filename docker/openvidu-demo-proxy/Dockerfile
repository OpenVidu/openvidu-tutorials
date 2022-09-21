FROM nginx:1.23.1-alpine

# Nginx conf
COPY ./conf/html /var/www/html
COPY ./conf/default.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY ./entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD /usr/local/bin/entrypoint.sh
