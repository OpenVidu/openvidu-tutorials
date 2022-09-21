#!/bin/sh

# Show input enviroment variables
echo "Application server: ${URL_APPLICATION_SERVER}"
echo "openvidu-js-demo: ${URL_OV_JS_DEMO}"
echo "openvidu-js-screen-share-demo: ${URL_OV_JS_SCREENSHARE_DEMO}"
echo "openvidu-roles-java-demo: ${URL_OV_ROLES_JAVA_DEMO}"
echo "openvidu-classroom-demo: ${URL_OV_CLASSROOM_DEMO}"
echo "openvidu-getaroom-demo: ${URL_OV_GETAROOM_DEMO}"
echo "openvidu-call: ${URL_OV_CALL}"

# Load nginx conf files
sed -i "s|url_application_server|${URL_APPLICATION_SERVER}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_js_demo|${URL_OV_JS_DEMO}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_js_screenshare_demo|${URL_OV_JS_SCREENSHARE_DEMO}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_roles_java_demo|${URL_OV_ROLES_JAVA_DEMO}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_classroom_demo|${URL_OV_CLASSROOM_DEMO}|" /etc/nginx/conf.d/default.conf
sed -i "s|url_ov_getaroom_demo|${URL_OV_GETAROOM_DEMO}|" /etc/nginx/conf.d/default.conf
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
