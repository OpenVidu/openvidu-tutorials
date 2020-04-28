#!/bin/sh

if [ -z "${MYSQL_ROOT_PASSWORD}" ]; then 
    MYSQL_ROOT_PASSWORD=$(cat < /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    export MYSQL_ROOT_PASSWORD
fi

if [ -z "${MYSQL_DATABASE}" ]; then 
    MYSQL_DATABASE=openvidu_sample_app
    export MYSQL_DATABASE
fi

echo "MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}"
echo "MYSQL_DATABASE: ${MYSQL_DATABASE}"
[ ! -z "${OPENVIDU_URL}" ] && echo "OPENVIDU_URL: ${OPENVIDU_URL}" || echo "OPENVIDU_URL: default"
[ ! -z "${OPENVIDU_SECRET}" ] && echo "OPENVIDU_SECRET: ${OPENVIDU_SECRET}" || echo "OPENVIDU_SECRET: default"
[ ! -z "${APP_PORT}" ] && echo "APP_PORT: ${APP_PORT}" || echo "APP_PORT: default"

# Configure MySQL

if [ -d "/run/mysqld" ]; then
	echo "mysqld already present, skipping creation"
	chown -R mysql:mysql /run/mysqld
else
	echo "mysqld not found, creating...."
	mkdir -p /run/mysqld
	chown -R mysql:mysql /run/mysqld
fi

if [ -d /var/lib/mysql/mysql ]; then
	echo "MySQL directory already present, skipping creation"
	chown -R mysql:mysql /var/lib/mysql
else
  tfile=$(mktemp)

  mysql_install_db --user=mysql --ldata=/var/lib/mysql > /dev/null

  cat << EOF > "$tfile"
USE mysql;
FLUSH PRIVILEGES ;
GRANT ALL ON *.* TO 'root'@'%' identified by '$MYSQL_ROOT_PASSWORD' WITH GRANT OPTION ;
GRANT ALL ON *.* TO 'root'@'localhost' identified by '$MYSQL_ROOT_PASSWORD' WITH GRANT OPTION ;
SET PASSWORD FOR 'root'@'localhost'=PASSWORD('${MYSQL_ROOT_PASSWORD}') ;
DROP DATABASE IF EXISTS test ;
FLUSH PRIVILEGES ;
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} CHARACTER SET utf8 COLLATE utf8_general_ci;
EOF

  /usr/bin/mysqld --user=mysql --bootstrap --verbose=0 --skip-name-resolve --skip-networking=0 < "$tfile"
  rm -f "$tfile"
fi

/usr/bin/mysqld --user=mysql --skip-name-resolve --skip-networking=0 &

# Run Application
JAVA_PROPERTIES="-Djava.security.egd=file:/dev/./urandom"
JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dspring.datasource.password=${MYSQL_ROOT_PASSWORD}"
JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dspring.datasource.url=jdbc:mysql://127.0.0.1:3306/${MYSQL_DATABASE}"
[ ! -z "${OPENVIDU_URL}" ] && JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dopenvidu.url=${OPENVIDU_URL}"
[ ! -z "${OPENVIDU_SECRET}" ] && JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dopenvidu.secret=${OPENVIDU_SECRET}"
[ ! -z "${APP_PORT}" ] && JAVA_PROPERTIES=" ${JAVA_PROPERTIES} -Dserver.port=${APP_PORT}"

java ${JAVA_PROPERTIES} -jar /opt/classroom-demo.jar
