#!/bin/bash

# For this script to properly run, repository https://github.com/OpenVidu/openvidu.git should be
# cloned at the same level as this https://github.com/OpenVidu/openvidu-tutorials.git repository

cd ../../openvidu/openvidu-browser || exit
if [ ! -d node_modules ]; then
  npm install
  npm run build
fi
export VERSION=2.17.0
npm run browserify
mv static/js/openvidu-browser-2.17.0.js ../../openvidu-tutorials/openvidu-hark-events/web/