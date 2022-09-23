#!/bin/bash

echo "Installing roonumio Dependencies"
apt-get -qq update
# Install the required packages via apt-get
apt-get -qqy install bzip2

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
MACHINE_ARCH=$(uname -m)
# Then use it to differentiate your install
PLUGIN_DIR="$( cd "$(dirname "$0")" ; pwd -P )"
PLUGIN_CATEGORY=$(cat "$PLUGIN_DIR"/package.json | jq -r ".volumio_info.plugin_type")
PACKAGE_NAME=$(cat "$PLUGIN_DIR"/package.json | jq -r ".name")
PACKAGE_NAME_LOWER=`echo "$PACKAGE_NAME" | tr "[A-Z]" "[a-z]"`
TMPDIR=`mktemp -d`
INSTALL_DIR="/data/plugins/$PLUGIN_CATEGORY/$PACKAGE_NAME"

exit_cleanup () {
  echo "Exit Status: $R"
  if [ $R -eq 1 ]; then
    echo "Plugin ${name} failed to install!"
    echo "Cleaning up.."
    if [ -d "$INSTALL_DIR" ]; then
      echo "Removing installation directory.."
      rm -Rf "$INSTALL_DIR"
    else
      echo "Installation directory does not exist."
    fi
  fi
  if [ -d "$TMPDIR" ]; then
    echo "Removing temp directory.."
    rm -Rf "$TMPDIR"
  fi
  echo "plugininstallend"
}
trap exit_cleanup EXIT

case "$MACHINE_ARCH" in
        armv7*)
            ARCH="armv7hf"
            ;;
        aarch64*)
            ARCH="armv7hf"
            ;;
        x86_64*)
            ARCH="x64"
            ;;
        *)
            echo "Platform $MACHINE_ARCH is not supported!"
            R=1
            exit 1;

esac

PACKAGE_FILE="RoonBridge_linux${ARCH}.tar.bz2"
PACKAGE_URL="http://download.roonlabs.com/builds/${PACKAGE_FILE}"

echo "Downloading $PACKAGE_FILE to $TMPDIR/$PACKAGE_FILE"
#curl -# -o "$TMPDIR/$PACKAGE_FILE" "$PACKAGE_URL"

DL_STATUSCODE=$(curl --write-out '%{http_code}' -sLfo "$TMPDIR/$PACKAGE_FILE" "$PACKAGE_URL")
R=$?

if [ $R -ne 0 ] | [ $DL_STATUSCODE -ne 200 ]; then
  # manually setting status code to 1 for a failed download (e.g. 404 error).
  R="1"
  echo "Download of RoonBridge for your volumio architecture failed!"
  echo "URL: $PACKAGE_URL"
  echo "HTTP Status Code: $DL_STATUSCODE"
  exit 1
fi

echo "Unpacking ${PACKAGE_FILE}..."
cd $TMPDIR
tar xf "$PACKAGE_FILE"
R=$?

if [ $R -ne 0 ]; then
  echo "An error occured while decompressing ${PACKAGE_FILE}."
  exit 1
fi


echo "Moving Files into plugin directory."
mv "$TMPDIR/RoonBridge" "$INSTALL_DIR"
rm -Rf "$TMPDIR"

echo "Creating service file."
SERVICE_FILE=/lib/systemd/system/roonbridge.service
cat > $SERVICE_FILE << END_SYSTEMD
[Unit]
Description=RoonBridge
After=dynamicswap.service

[Service]
Type=simple
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$PACKAGE_NAME
User=root
Environment=ROON_DATAROOT=/data/configuration/$PLUGIN_CATEGORY/$PACKAGE_NAME
Environment=ROON_ID_DIR=/data/configuration/$PLUGIN_CATEGORY/$PACKAGE_NAME
Environment=DAEMON_PIDFILE=/tmp/roonbridge.pid
Environment=DAEMON_LOGFILE=/tmp/roonbridge.log
ExecStart=/data/plugins/$PLUGIN_CATEGORY/$PACKAGE_NAME/RoonBridge/start.sh
Restart=always

[Install]
WantedBy=multi-user.target
END_SYSTEMD

# Change Owner of files to volumio
chown -R volumio:volumio $INSTALL_DIR

#required to end the plugin install
# `echo "plugininstallend"` is called in the exit_cleanup function which is executed by a trap on exit.