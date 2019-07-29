FROM ubuntu:16.04
LABEL maintainer="openvidu@gmail.com"

# Install Kurento Media Server (KMS) 
RUN echo "deb [arch=amd64] http://ubuntu.openvidu.io/6.11.0 xenial kms6" | tee /etc/apt/sources.list.d/kurento.list \
	&& apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 5AFA7A83 \
	&& apt-get update \
	&& apt-get -y install kurento-media-server \
	&& rm -rf /var/lib/apt/lists/*

COPY kms.sh /kms.sh
COPY web /web/

# Install Java
RUN apt-get update && apt-get install -y openjdk-8-jdk && rm -rf /var/lib/apt/lists/*

# Configure Supervisor
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Install OpenVidu Server
COPY openvidu-server.jar openvidu-server.jar

EXPOSE 4443

# Exec supervisord
CMD ["/usr/bin/supervisord"]
