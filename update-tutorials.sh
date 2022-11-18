#!/bin/bash
set -eo pipefail

if [[ -z "$FROM_VERSION" || -z "$TO_VERSION" ]]; then
    echo
    echo "Examples of use: "
    echo "   export FROM_VERSION=2.12.0; export TO_VERSION=2.13.0; ${0}"
    echo "   export FROM_VERSION=2.12.0; export TO_VERSION=2.13.0; export FROM_VERSION_SDK=2.12.0; export TO_VERSION_SDK=2.13.0; ${0}"
    echo
    exit 1
fi

if [[ -z "$FROM_VERSION_SDK" || -z "$TO_VERSION_SDK" ]]; then
    echo
    echo "No FROM_VERSION_SDK and TO_VERSION_SDK properties provided. Server SDKs depdendencies won't be updated."
    echo "To update also server SDKs dependencies, run the script like this:"
    echo "   export FROM_VERSION=2.12.0; export TO_VERSION=2.13.0; export FROM_VERSION_SDK=2.12.0; export TO_VERSION_SDK=2.13.0; ${0}"
    echo
    read -p "Do you still want to continue? [Y/N]" -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then :
    else
        echo "Aborted"
        exit 1
    fi
fi

echo
echo "## Updating openvidu-tutorials"
echo "## From $FROM_VERSION to $TO_VERSION"
if [[ ! -z "$FROM_VERSION_SDK" || ! -z "$TO_VERSION_SDK" ]]; then
    echo "## From SDK $FROM_VERSION_SDK to SDK $TO_VERSION_SDK"
fi
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
find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-browser\": \"$FROM_VERSION\"/\"openvidu-browser\": \"$TO_VERSION\"/" {} \;

# Updating openvidu-react dependencies in package.json files [openvidu-library-react]
find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-react\": \"$FROM_VERSION\"/\"openvidu-react\": \"$TO_VERSION\"/" {} \;

# Updating openvidu-angular dependencies in package.json files [openvidu-call, openvidu-components/*]
find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-angular\": \"$FROM_VERSION\"/\"openvidu-angular\": \"$TO_VERSION\"/" {} \;
find . -type f -name 'package.json' -exec sed -i "s/file:openvidu-angular-$FROM_VERSION.tgz/file:openvidu-angular-$TO_VERSION.tgz/" {} \;

# Updating openvidu-react-native-adapter dependencies in package.json files [openvidu-react-native]
find . -type f -name 'package.json' -exec sed -i "s/file:openvidu-react-native-adapter-$FROM_VERSION.tgz/file:openvidu-react-native-adapter-$TO_VERSION.tgz/" {} \;

# If server SDKs must be udpated
if [[ -n "$FROM_VERSION_SDK" && -n "$TO_VERSION_SDK" ]]; then

    # Updating openvidu-node-client dependencies in package.json files [openvidu-roles-node, openvidu-recording-node, openvidu-basic-node]
    find . -type f -name 'package.json' -exec sed -i "s/\"openvidu-node-client\": \"$FROM_VERSION_SDK\"/\"openvidu-node-client\": \"$TO_VERSION_SDK\"/" {} \;

    # Updating openvidu-java-client dependencies in pom.xml files
    for tutorial in ${MAVEN_TUTORIALS}
    do
        cd $tutorial
        mvn --batch-mode versions:use-dep-version -Dincludes=io.openvidu:openvidu-java-client -DdepVersion=$TO_VERSION_SDK -DforceVersion=true
        cd ..
    done

fi

# Update every <script src="openvidu-browser-VERSION.js"></script> import in every *.html or *.ejs file (15 files changed)
for file in *.html *.ejs; do
    echo
    echo "###############################"
    echo "Updating openvidu-browser <script> tag in $file"
    echo "###############################"
    echo
    find . -type f -name $file -exec sed -i "s/<script src=\"openvidu-browser-$FROM_VERSION.js\"><\/script>/<script src=\"openvidu-browser-$TO_VERSION.js\"><\/script>/" {} \;
done

# Update every openvidu-browser-VERSION.js file (15 FILES CHANGED)
wget https://github.com/OpenVidu/openvidu/releases/download/v$TO_VERSION/openvidu-browser-$TO_VERSION.js
readarray MY_ARRAY < <(find -name "openvidu-browser-$FROM_VERSION.js" -printf "%h\n" | sort -u)
for directory in ${MY_ARRAY[@]}
do
    echo
    echo "###############################"
    echo "Replacing $directory/openvidu-browser-$FROM_VERSION.js with openvidu-browser-$TO_VERSION.js"
    echo "###############################"
    echo
    rm $directory/openvidu-browser-$FROM_VERSION.js
    cp openvidu-browser-$TO_VERSION.js $directory/openvidu-browser-$TO_VERSION.js
done
rm openvidu-browser-$TO_VERSION.js

# Run "npm install" in every NPM project
for tutorial in ${NPM_TUTORIALS}
do
    echo
    echo "###############################"
    echo "Compiling NPM project $tutorial"
    echo "###############################"
    echo
    pushd $tutorial
    npm --no-git-tag-version --allow-same-version version $TO_VERSION
    npm install --force || true
    popd
done

# Run "npm install" in every OpenVidu Components tutorial
readarray -d '' OPENVIDU_COMPONENTS_TUTORIALS < <(find ./openvidu-components -mindepth 1 -maxdepth 1 -type d -print0)
for tutorial in ${OPENVIDU_COMPONENTS_TUTORIALS[@]}
do
    echo
    echo "###############################"
    echo "Compiling NPM OpenVidu Components project $tutorial"
    echo "###############################"
    echo
    pushd $tutorial
    npm --no-git-tag-version --allow-same-version version $TO_VERSION
    npm install --force || true
    popd
done

# Run "mvn clean compile package" in every Maven project
for tutorial in ${MAVEN_TUTORIALS}
do
    echo
    echo "###############################"
    echo "Compiling Maven project $tutorial"
    echo "###############################"
    echo
    cd $tutorial
    mvn versions:set -DnewVersion=$TO_VERSION
    mvn clean compile package || true
    cd ..
done

# Update openvidu-webcomponent tutorial files: static web component files and import inside index.html

echo
echo "###############################"
echo "Updating openvidu-webcomponent tutorial"
echo "###############################"
wget https://github.com/OpenVidu/openvidu/releases/download/v$TO_VERSION/openvidu-webcomponent-$TO_VERSION.zip
mkdir openvidu-webcomponent-$TO_VERSION
mv openvidu-webcomponent-$TO_VERSION.zip openvidu-webcomponent-$TO_VERSION/openvidu-webcomponent-$TO_VERSION.zip
unzip openvidu-webcomponent-$TO_VERSION/openvidu-webcomponent-$TO_VERSION.zip -d openvidu-webcomponent-$TO_VERSION/.
rm openvidu-webcomponent/web/openvidu-webcomponent-$FROM_VERSION.js
rm openvidu-webcomponent/web/openvidu-webcomponent-$FROM_VERSION.css
mv openvidu-webcomponent-$TO_VERSION/openvidu-webcomponent-$TO_VERSION.js openvidu-webcomponent/web/.
mv openvidu-webcomponent-$TO_VERSION/openvidu-webcomponent-$TO_VERSION.css openvidu-webcomponent/web/.
rm -rf openvidu-webcomponent-$TO_VERSION
sed -i "s/<script src=\"openvidu-webcomponent-$FROM_VERSION.js\"><\/script>/<script src=\"openvidu-webcomponent-$TO_VERSION.js\"><\/script>/" openvidu-webcomponent/web/index.html
sed -i "s/<link rel=\"stylesheet\" href=\"openvidu-webcomponent-$FROM_VERSION.css\">/<link rel=\"stylesheet\" href=\"openvidu-webcomponent-$TO_VERSION.css\">/" openvidu-webcomponent/web/index.html

echo
echo "###################################"
echo "SUCCESS UPDATING OPENVIDU-TUTORIALS"
echo "###################################"
echo
