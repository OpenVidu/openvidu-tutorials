#!/bin/bash -x

echo "## Updating openvidu-tutorials"

find -type f -name 'package-lock.json' -exec rm {} \;
find -type d -name 'node_modules' -exec rm -rf {} \;

# Updating openvidu-browser dependencies in package.json files [openvidu-insecure-angular, openvidu-insecure-react, openvidu-ionic, openvidu-react-native]
find . -type f -name 'package.json' -not \( -path '*/node_modules/*' -o -path '*/package-lock.json'  \) -exec sed -i "s/\"openvidu-browser\": \"$FROM_VERSION\"/\"openvidu-browser\": \"$TO_VERSION\"/" {} \;

# Updating openvidu-react dependencies in package.json files [openvidu-library-react]
find . -type f -name 'package.json' -not \( -path '*/node_modules/*' -o -path '*/package-lock.json'  \) -exec sed -i "s/\"openvidu-react\": \"$FROM_VERSION\"/\"openvidu-react\": \"$TO_VERSION\"/" {} \;

# Updating openvidu-angular dependencies in package.json files [openvidu-library-angular]
find . -type f -name 'package.json' -not \( -path '*/node_modules/*' -o -path '*/package-lock.json'  \) -exec sed -i "s/\"openvidu-angular\": \"$FROM_VERSION\"/\"openvidu-angular\": \"$TO_VERSION\"/" {} \;

# Run "npm install" in every npm project [openvidu-insecure-angular, openvidu-insecure-react, openvidu-library-angular, openvidu-library-react, openvidu-ionic, openvidu-js-node, openvidu-mvc-node, openvidu-recording-node]
for tutorial in openvidu-insecure-angular openvidu-insecure-react openvidu-library-angular openvidu-library-react openvidu-ionic openvidu-js-node openvidu-mvc-node openvidu-recording-node; do
    cd $tutorial && npm install && cd ..
done

# Update every <script src="openvidu-browser-VERSION.js"></script> import in every *.html or *.ejs file (13 files changed)
for file in *.html *.ejs; do
    find . -type f -name $file -not \( -path '*/node_modules/*' -o -path '*/package-lock.json'  \) -exec sed -i "s/<script src=\"openvidu-browser-$FROM_VERSION.js\"><\/script>/<script src=\"openvidu-browser-$TO_VERSION.js\"><\/script>/" {} \;
done

# Update every openvidu-browser-VERSION.js file (12 files changed)
wget https://github.com/OpenVidu/openvidu/releases/download/v$TO_VERSION/openvidu-browser-$TO_VERSION.js
readarray array < <(find -name "openvidu-browser-$FROM_VERSION.js" -printf "%h\n" | sort -u)
for directory in ${array[@]}; do
    rm $directory/openvidu-browser-$FROM_VERSION.js
    cp openvidu-browser-$TO_VERSION.js $directory/openvidu-browser-$TO_VERSION.js
done
rm openvidu-browser-$TO_VERSION.js

# Update openvidu-webcomponent tutorial files: static web component files and import in index.html
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

