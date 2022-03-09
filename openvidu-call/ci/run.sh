#!/bin/bash -x
set -eu -o pipefail

git clone https://github.com/openvidu/openvidu-call
cd openvidu-call/front/openvidu-call/
npm install
./node_modules/protractor/bin/protractor ./e2e/protractor.conf.js --baseUrl=${APP_URL}