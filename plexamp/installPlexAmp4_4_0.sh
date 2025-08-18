#! /bin/bash

# Make sure we are in the correct folder
if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

# Install Expect to we can interact with plexamp to activate it without human interaction
apt-get -qqy install expect

# Download and extract plexamp 4_4
echo "Download plexamp..."  | systemd-cat
wget https://plexamp.plex.tv/headless/Plexamp-Linux-headless-v4.4.0.tar.bz2
tar -xf Plexamp-Linux-headless-v4.4.0.tar.bz2

# 4_4 needs node 12 but volumio has 14 so lets download nvm first
echo "Installing NVM..."  | systemd-cat
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# export NVM so it can be usable below
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;

# install node 12 for plexamp
echo "Installing Node 12 for older Plexamp..."  | systemd-cat
nvm install 12

# but make sure we use the system one by default
nvm use system

# install or custom plex
echo "Copying plexamp service..."  | systemd-cat
cp plexamp.service /etc/systemd/system/plexamp.service

echo "Activating plexamp with claim token $1 ..." | systemd-cat
h=$(hostname -f)
chmod +x activatePlexAmp.exp
./activatePlexAmp.exp $1 $h

# enable the plexamp.service
echo "Enabling plexamp ..." | systemd-cat

systemctl enable plexamp.service
systemctl start plexamp.service

echo "Headless PlexAmp installed" | systemd-cat
