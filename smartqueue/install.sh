#!/bin/bash

##  installation script
echo "Installing Smartqueue and its dependencies..."

sudo apt-get update

echo "Installing ShellInAbox..."
sudo apt-get install -f shellinabox -y
sudo apt-get install -f python-pip -y
sudo pip install requests

sudo apt-get -f install -y
sudo apt --fix-broken install

echo "plugininstallend"