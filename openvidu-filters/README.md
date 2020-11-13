[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Documentation Status](https://readthedocs.org/projects/openviduio-docs/badge/?version=stable)](https://docs.openvidu.io/en/stable/?badge=stable)
[![Docker badge](https://img.shields.io/docker/pulls/openvidu/openvidu-server-kms.svg)](https://hub.docker.com/r/openvidu/openvidu-server-kms)
[![Support badge](https://img.shields.io/badge/support-sof-yellowgreen.svg)](https://groups.google.com/forum/#!forum/openvidu)

[![][OpenViduLogo]](http://openvidu.io)

openvidu-filters
===

Visit [docs.openvidu.io/en/stable/advanced-features/filters](http://docs.openvidu.io/en/stable/advanced-features/filters/)

[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120

## Run this application

```bash
# Launch OpenVidu Server
docker run --rm -d -p 4443:4443 -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms:2.16.0

# Clone and serve openvidu-filters application
git clone https://github.com/OpenVidu/openvidu-tutorials.git
cd openvidu-tutorials/openvidu-filters
http-server web/
```

You will need `http-server` npm package (`sudo npm install -g http-server`), and you will need to accept the insecure certificate at [https://localhost:4443](https://localhost:4443) once you launch openvidu-server-kms docker container.
