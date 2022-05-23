#!/bin/sh

# Show input enviroment variables
echo "openvidu-basic-videoconference: ${URL_OV_BASIC_VIDEOCONFERENCE}"
echo "openvidu-basic-screenshare: ${URL_OV_BASIC_SCREENSHARE}"
echo "openvidu-basic-webinar: ${URL_OV_BASIC_WEBINAR}"
echo "openvidu-classroom: ${URL_OV_CLASSROOM}"
echo "openvidu-getaroom: ${URL_OV_GETAROOM}"
echo "openvidu-call: ${URL_OV_CALL}"

# Load nginx conf files
sed -i "s|url_ov_basic_videoconference|${URL_OV_BASIC_VIDEOCONFERENCE}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_basic_screenshare|${URL_OV_BASIC_SCREENSHARE}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_basic_webinar|${URL_OV_BASIC_WEBINAR}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_classroom|${URL_OV_CLASSROOM}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_getaroom|${URL_OV_GETAROOM}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_call|${URL_OV_CALL}|" /etc/nginx/conf.d/default.conf

cat > /tmp/redirect_index_to_domain.tpl <<EOL
    location / {
        rewrite ^/$ {{ redirect_domain }} redirect;
    }
EOL

if [ -n "${REDIRECT_INDEX_TO_DOMAIN}" ]; then
    sed -i '/{{ no_redirect_to_domain }}/d' /etc/nginx/conf.d/default.conf
    sed -i "s|{{ redirect_domain }}|${REDIRECT_INDEX_TO_DOMAIN}|" /tmp/redirect_index_to_domain.tpl
    sed -e '/{{ redirect_index_to_domain }}/{r /tmp/redirect_index_to_domain.tpl' -e 'd}' -i /etc/nginx/conf.d/default.conf
    rm /tmp/redirect_index_to_domain.tpl
else
    sed -i "s|{{ no_redirect_to_domain }}|root /var/www/html;|" /etc/nginx/conf.d/default.conf
    sed -i '/{{ redirect_index_to_domain }}/d' /etc/nginx/conf.d/default.conf
    rm /tmp/redirect_index_to_domain.tpl
fi

# Run nginx
nginx -g "daemon off;"

# Show logs
tail -f /var/log/nginx/*.log
