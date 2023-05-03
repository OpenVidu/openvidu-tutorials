#!/bin/bash
set -eo pipefail

if [[ -z "$VERSION" || -z "$FROM_OPENVIDU_BROWSER_VERSION" || -z "$TO_OPENVIDU_BROWSER_VERSION" || -z "$FROM_OPENVIDU_NODE_CLIENT_VERSION" || -z "$TO_OPENVIDU_NODE_CLIENT_VERSION" || -z "$TO_OPENVIDU_JAVA_CLIENT_VERSION" ]]; then
    echo
    echo "Must declare:"
    echo "- The new version of the projects with VERSION"
    echo "- The previous and new version of openvidu-browser (and related libraries) with FROM_OPENVIDU_BROWSER_VERSION and TO_OPENVIDU_BROWSER_VERSION"
    echo "- The previous and new version of openvidu-node-client with FROM_OPENVIDU_NODE_CLIENT_VERSION and TO_OPENVIDU_NODE_CLIENT_VERSION"
    echo "- The new version of openvidu-java-client with TO_OPENVIDU_JAVA_CLIENT_VERSION"
    echo
    echo "Example of use:"
    echo
    echo "export VERSION=2.26.0"
    echo "export FROM_OPENVIDU_BROWSER_VERSION=2.25.0"
    echo "export TO_OPENVIDU_BROWSER_VERSION=2.26.0"
    echo "export FROM_OPENVIDU_NODE_CLIENT_VERSION=2.25.0"
    echo "export TO_OPENVIDU_NODE_CLIENT_VERSION=2.26.0"
    echo "export TO_OPENVIDU_JAVA_CLIENT_VERSION=2.26.0"
    echo "${0}"
    echo
    exit 1
fi

echo
echo "## Updating openvidu-tutorials to $VERSION"
echo "## - From openvidu-browser $FROM_OPENVIDU_BROWSER_VERSION to $TO_OPENVIDU_BROWSER_VERSION"
echo "## - From openvidu-node-client $FROM_OPENVIDU_NODE_CLIENT_VERSION to $TO_OPENVIDU_NODE_CLIENT_VERSION"
echo "## - To openvidu-java-client $TO_OPENVIDU_JAVA_CLIENT_VERSION"
echo

NPM_TUTORIALS="openvidu-angular
                openvidu-react
                openvidu-library-react
                openvidu-ionic
                openvidu-ionic/electron
                openvidu-ionic-cordova
                openvidu-roles-node
                openvidu-recording-node
                openvidu-react-native
                openvidu-electron
                openvidu-vue
                openvidu-basic-node"

MAVEN_TUTORIALS="openvidu-roles-java
                openvidu-recording-java
                openvidu-ipcameras
                openvidu-basic-java
                openvidu-fault-tolerance"

# Delete all package-lock.json and node_modules
find -type f -name 'package-lock.json' -exec rm {} \;
find -type d -name 'node_modules' -prune -exec rm -rf {} \;

# Updating openvidu-browser dependencies in package.json files [openvidu-angular, openvidu-react, openvidu-ionic, openvidu-vue]
find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-browser\": \"$FROM_OPENVIDU_BROWSER_VERSION\"/\"openvidu-browser\": \"$TO_OPENVIDU_BROWSER_VERSION\"/" {} \;

## TODO: change this when OpenVidu Components for React is released
# Updating openvidu-react dependencies in package.json files [openvidu-library-react]
# find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-react\": \"$FROM_OPENVIDU_BROWSER_VERSION\"/\"openvidu-react\": \"$TO_OPENVIDU_BROWSER_VERSION\"/" {} \;

# Updating openvidu-angular dependencies in package.json files [openvidu-call, openvidu-components/*]
find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-angular\": \"$FROM_OPENVIDU_BROWSER_VERSION\"/\"openvidu-angular\": \"$TO_OPENVIDU_BROWSER_VERSION\"/" {} \;
find . -type f -name 'package.json' -exec sed -i "s/file:openvidu-angular-$FROM_OPENVIDU_BROWSER_VERSION.tgz/file:openvidu-angular-$TO_OPENVIDU_BROWSER_VERSION.tgz/" {} \;

# Updating openvidu-react-native-adapter dependencies in package.json files [openvidu-react-native]
find . -type f -name 'package.json' -exec sed -i "s/file:openvidu-react-native-adapter-$FROM_OPENVIDU_BROWSER_VERSION.tgz/file:openvidu-react-native-adapter-$TO_OPENVIDU_BROWSER_VERSION.tgz/" {} \;

# Updating openvidu-node-client dependencies in package.json files [openvidu-roles-node, openvidu-recording-node, openvidu-basic-node]
find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-node-client\": \"$FROM_OPENVIDU_NODE_CLIENT_VERSION\"/\"openvidu-node-client\": \"$TO_OPENVIDU_NODE_CLIENT_VERSION\"/" {} \;

# Updating openvidu-java-client dependencies in pom.xml files
for tutorial in ${MAVEN_TUTORIALS}; do
    cd $tutorial
    mvn --batch-mode versions:use-dep-version -Dincludes=io.openvidu:openvidu-java-client -DdepVersion=$TO_OPENVIDU_JAVA_CLIENT_VERSION -DforceVersion=true
    cd ..
done

# Update every <script src="openvidu-browser-VERSION.js"></script> import in every *.html or *.ejs file (15 files changed)
for file in *.html *.ejs; do
    echo
    echo "###############################"
    echo "Updating openvidu-browser <script> tag in $file"
    echo "###############################"
    echo
    find . -type f -name $file -exec sed -i "s/<script src=\"openvidu-browser-$FROM_OPENVIDU_BROWSER_VERSION.js\"><\/script>/<script src=\"openvidu-browser-$TO_OPENVIDU_BROWSER_VERSION.js\"><\/script>/" {} \;
done

# Update every openvidu-browser-VERSION.js file (15 FILES CHANGED)
wget https://github.com/OpenVidu/openvidu/releases/download/v$VERSION/openvidu-browser-$TO_OPENVIDU_BROWSER_VERSION.js
readarray MY_ARRAY < <(find -name "openvidu-browser-$FROM_OPENVIDU_BROWSER_VERSION.js" -printf "%h\n" | sort -u)
for directory in ${MY_ARRAY[@]}; do
    echo
    echo "###############################"
    echo "Replacing $directory/openvidu-browser-$FROM_OPENVIDU_BROWSER_VERSION.js with openvidu-browser-$TO_OPENVIDU_BROWSER_VERSION.js"
    echo "###############################"
    echo
    rm $directory/openvidu-browser-$FROM_OPENVIDU_BROWSER_VERSION.js
    cp openvidu-browser-$TO_OPENVIDU_BROWSER_VERSION.js $directory/openvidu-browser-$TO_OPENVIDU_BROWSER_VERSION.js
done
rm openvidu-browser-$TO_OPENVIDU_BROWSER_VERSION.js

# Run "npm install" in every NPM project
for tutorial in ${NPM_TUTORIALS}; do
    echo
    echo "###############################"
    echo "Compiling NPM project $tutorial"
    echo "###############################"
    echo
    pushd $tutorial
    npm --no-git-tag-version --allow-same-version version $VERSION

    # Ignore openvidu-react-native failure
    # It fails if openvidu-react-native-adapter-*.tgz is not available
    if [ "$tutorial" == "openvidu-react-native" ]; then
        npm install --force || true
    else
        npm install --force
    fi

    popd
done

# Run "npm install" in every OpenVidu Components tutorial
readarray -d '' COMPONENTS_TUTORIALS < <(find ./openvidu-components -mindepth 2 -maxdepth 2 -type f -path '*/package.json' -printf '%h\n')
for tutorial in ${COMPONENTS_TUTORIALS[@]}; do
    echo
    echo "###############################"
    echo "Compiling NPM OpenVidu Components project $tutorial"
    echo "###############################"
    echo
    pushd $tutorial
    npm --no-git-tag-version --allow-same-version version $VERSION
    npm install
    popd
done

# Run "mvn clean compile package" in every Maven project
for tutorial in ${MAVEN_TUTORIALS}; do
    echo
    echo "###############################"
    echo "Compiling Maven project $tutorial"
    echo "###############################"
    echo
    cd $tutorial
    mvn versions:set -DnewVersion=$VERSION
    mvn clean compile package
    cd ..
done

# Update openvidu-webcomponent tutorial files: static web component files and import inside index.html

echo
echo "###############################"
echo "Updating openvidu-webcomponent tutorial"
echo "###############################"
wget https://github.com/OpenVidu/openvidu/releases/download/v$VERSION/openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.zip
mkdir openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION
mv openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.zip openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION/openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.zip
unzip openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION/openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.zip -d openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION/.
rm openvidu-webcomponent/web/openvidu-webcomponent-$FROM_OPENVIDU_BROWSER_VERSION.js
rm openvidu-webcomponent/web/openvidu-webcomponent-$FROM_OPENVIDU_BROWSER_VERSION.css
mv openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION/openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.js openvidu-webcomponent/web/.
mv openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION/openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.css openvidu-webcomponent/web/.
rm -rf openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION
sed -i "s/<script src=\"openvidu-webcomponent-$FROM_OPENVIDU_BROWSER_VERSION.js\"><\/script>/<script src=\"openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.js\"><\/script>/" openvidu-webcomponent/web/index.html
sed -i "s/<link rel=\"stylesheet\" href=\"openvidu-webcomponent-$FROM_OPENVIDU_BROWSER_VERSION.css\">/<link rel=\"stylesheet\" href=\"openvidu-webcomponent-$TO_OPENVIDU_BROWSER_VERSION.css\">/" openvidu-webcomponent/web/index.html

# Update parameter "sdkVersion" in openvidu-android

sed -i -r "s%\"sdkVersion\",(\s*)\"([[:alnum:]._-]+)\"%\"sdkVersion\",\1\"${TO_OPENVIDU_BROWSER_VERSION}\"%g" openvidu-android/app/src/main/java/io/openvidu/openvidu_android/websocket/CustomWebSocket.java

echo
echo "###################################"
echo "SUCCESS UPDATING OPENVIDU-TUTORIALS"
echo "###################################"
echo
