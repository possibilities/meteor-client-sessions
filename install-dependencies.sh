#!/bin/bash
#
# Until Meteor with something better,
#    This script installs the required dependencies into meteor


SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ] ; do SOURCE="$(readlink "$SOURCE")"; done
CLIENT_SESSIONS="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

read -p "Where is your meteor installation? (typically: /usr/local/meteor): " -e installpath

[[ -z $installpath ]] && installpath="/usr/local/meteor"

# Validate the path
echo -n "Validating $installpath..."

[[ ! -f "$installpath/LICENSE.txt" ]] && echo "Invalid meteor path" && exit 1
[[ ! -d "$installpath/packages" ]] && echo "Invalid meteor path" && exit 1

echo "Good!"

installpath="$installpath/packages"


# Prepare the checkout
[[ -d /tmp/dependencies ]] && rm -rf /tmp/dependencies

mkdir -p /tmp/dependencies
cd /tmp/dependencies

# checkout
git clone https://github.com/possibilities/meteor-filters.git
git clone https://github.com/possibilities/meteor-simple-secure.git

read -p "Do you plan on running the demo? (y/n)? " -n 1 -r
echo
[[ $REPLY = [yY]* ]] && {

    git clone https://github.com/possibilities/meteor-model-base.git
    git clone https://github.com/possibilities/meteor-party.git
    git clone https://github.com/possibilities/meteor-dev-trix.git
    git clone https://github.com/possibilities/meteor-demostrap.git
    git clone https://github.com/possibilities/meteor-environment-hooks.git
    git clone https://github.com/possibilities/meteor-simple-demo.git
    git clone https://github.com/possibilities/meteor-validation.git
    git clone https://github.com/possibilities/meteor-forms.git

}

# install
read -p "Please confirm installation (y/n)? " -n 1 -r
echo
[[ $REPLY = [nN]* ]] && exit 0

for i in `ls`
do
    mv -f "$i"/src/* "$installpath"
done

cp -R $CLIENT_SESSIONS/src/client-sessions "$installpath"
