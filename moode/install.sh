#!/bin/bash

echo "Installing moode Dependencies"
sudo apt-get update
# Install the required packages via apt-get
echo "Installing docker and its dependencies..."

sudo apt-get update -y

sudo curl -fsSL https://get.docker.com/ -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker volumio

echo " create container with systemd in priviledged mode and start it "

sudo docker volume create moode

sudo docker create --name debian-moode --restart always -v /sys/fs/cgroup:/sys/fs/cgroup:ro -v moode:/mnt/NAS --device /dev/snd --net host --privileged -e LANG=C.UTF-8 --cap-add=NET_ADMIN --security-opt seccomp:unconfined --cpu-shares=10240 chourmovs/debian-moode:armv7l

sudo docker container start debian-moode

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

#requred to end the plugin install
echo "plugininstallend"
