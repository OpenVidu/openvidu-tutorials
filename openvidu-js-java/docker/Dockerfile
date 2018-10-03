FROM ubuntu:16.04
MAINTAINER openvidu@gmail.com

# Install Kurento Media Server (KMS) 
RUN echo "deb http://ubuntu.openvidu.io/6.8.0 xenial kms6" | tee /etc/apt/sources.list.d/kurento.list \
	&& apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 5AFA7A83 \
	&& apt-get update \
	&& apt-get -y install kurento-media-server \
	&& rm -rf /var/lib/apt/lists/*

COPY kms.sh /kms.sh
COPY ngrok.sh /ngrok.sh

# Install Java
RUN apt-get update && apt-get install -y openjdk-8-jdk && rm -rf /var/lib/apt/lists/*

# ngrok
RUN apt-get update && apt-get install unzip
RUN set -x \
    && apt-get update \
    && apt-get install wget \
    && wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip \
    && unzip ngrok-stable-linux-amd64.zip -d /home/ngrok \
    && rm -f ngrok-stable-linux-amd64.zip ngrok

COPY ngrok.yml /home/ngrok/ngrok.yml

# Configure Supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*

COPY openvidu-server.jar openvidu-server.jar
COPY openvidu-js-java.jar app.jar
RUN sh -c 'touch /openvidu-server.jar'
RUN sh -c 'touch /app.jar'

RUN set -x \
    && echo 'ngrok:x:6737:6737:Ngrok user:/home/ngrok:/bin/false' >> /etc/passwd \
    && echo 'ngrok:x:6737:' >> /etc/group \
    && chown ngrok:ngrok /home/ngrok \
    && chmod -R go=u,go-w /home/ngrok \
    && chmod go= /home/ngrok

EXPOSE 3000
EXPOSE 5000
EXPOSE 4040

# Exec supervisord
CMD ["/usr/bin/supervisord"]
