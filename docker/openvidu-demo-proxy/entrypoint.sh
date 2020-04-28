#!/bin/sh

# Show input enviroment variables
echo "openvidu-basic-videoconference: ${URL_OV_BASIC_VIDEOCONFERENCE}"
echo "openvidu-basic-webinar: ${URL_OV_BASIC_WEBINAR}"
echo "openvidu-classroom: ${URL_OV_CLASSROOM}"
echo "openvidu-getaroom: ${URL_OV_GETAROOM}"
echo "openvidu-call: ${URL_OV_CALL}"

# Load nginx conf files
sed -i "s/url_ov_basic_videoconference/${URL_OV_BASIC_VIDEOCONFERENCE}/" /etc/nginx/conf.d/default.conf
sed -i "s/url_ov_basic_webinar/${URL_OV_BASIC_WEBINAR}/" /etc/nginx/conf.d/default.conf
sed -i "s/url_ov_classroom/${URL_OV_CLASSROOM}/" /etc/nginx/conf.d/default.conf
sed -i "s/url_ov_getaroom/${URL_OV_GETAROOM}/" /etc/nginx/conf.d/default.conf
sed -i "s/url_ov_call/${URL_OV_CALL}/" /etc/nginx/conf.d/default.conf

# Run nginx
nginx -g "daemon off;"

# Show logs
tail -f /var/log/nginx/*.log
