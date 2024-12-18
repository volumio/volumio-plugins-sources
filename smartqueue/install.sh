#!/bin/bash

##  installation script
echo "Installing Smartqueue and its dependencies..."

apt-get update

echo "Installing ShellInAbox..."
apt-get install -f shellinabox -y
apt-get install -f python3-requests -y
apt-get -f install -y
apt --fix-broken install

echo "plugininstallend"