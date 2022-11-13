#! /bin/bash

# Make sure we are in the correct folder
if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -e
pushd "$(dirname "$0")"/scripts > /dev/null

# Download and extract plexamp 4_4
echo "Download plexamp..."
wget https://plexamp.plex.tv/headless/Plexamp-Linux-headless-v4.4.0.tar.bz2
tar -xf Plexamp-Linux-headless-v4.4.0.tar.bz2

# 4_4 needs node 12 but volumio has 14 so lets download nvm first
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# install node 12 for plexamp
nvm install 12

# but make sure we use the system one by default
nvm use system

# install or custom plex
cp scripts/plexamp.service /etc/systemd/system/plexamp.service


mkdir -p /home/volumio/.local/share/Plexamp/Settings/
echo S$PLEX_TOKEN > /home/volumio/.local/share/Plexamp/Settings/%40Plexamp%3Auser%3Atoken
echo S$VOLUMIO_NAME > /home/volumio/.local/share/Plexamp/Settings/%40Plexamp%3Asettings%3AplayerName
echo S$VOLUMIO_NAME > /home/volumio/.local/share/Plexamp/Settings/%40Plexamp%3Aplayer%3Aname

# enable the plexamp.service
sudo systemctl enable plexamp.service
sudo systemctl start plexamp.service

popd > /dev/null
echo "Headless PlexAmp installed"
