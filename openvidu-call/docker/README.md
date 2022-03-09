## OpenVidu Call docker deployment

OpenVidu bases its deployment on Docker **since 2.13.0 version**.

**NOTE: docker can be use with OpenVidu Call since 2.14.0 version and above.**


### Build OpenVidu Call container

You have several options to build it:

####  stable.dockerfile

The aim of this docker file is generate a docker image from a OpenVidu Call release.

You must add a `RELEASE_VERSION` that you want to build.

To build it:

```bash
docker build -f stable.dockerfile -t <your-tag-name> --build-arg RELEASE_VERSION=<your-release-version> .
```

####  prod.dockerfile

The aim of this docker file is generate a docker image from a OpenVidu Call branch.

To build it:

```bash
docker build -f prod.dockerfile -t <your-tag-name> --build-arg BRANCH_NAME=<branch-name> --build-arg BASE_HREF=<your-base-href>.
```

By default, the **BRANCH_NAME** name will be `master` and **BASE_HREF** will be `/`.


####  dev.dockerfile

The aim of this docker file is generate a docker image from a OpenVidu Call branch intalling the `openvidu-browser` with the latest changes from **master** branch.


```bash
docker build -f dev.dockerfile -t <your-tag-name> --build-arg BRANCH_NAME=<branch-name> --build-arg BASE_HREF=<your-base-href>.
```
### Run OpenVidu Call container


```
docker run -p 5000:<your_port> -e SERVER_PORT=<your_port> -e OPENVIDU_URL=<your_openvidu_url> -e OPENVIDU_SECRET=<your_secret> openvidu/openvidu-call:X.Y.Z
```

Go to **http://localhost:your_port**