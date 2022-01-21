# volumio-snapserver-plugin
A new version of the SnapClient functionality, totally revamped. Super easy to install and configure.

## How to use
Just select a host from the drop-down, if you installed snapserver on any of your Volumio hosts of course. Otherwise, you can 'flick the switch' on 'custom host' and just fill in the IP-address of the host on which you're running the snapserver instance you wish to connect to.
Secondly, select your soundcard, if it's not listed, find out what it's called and add a CLI option ```-s {your soundcard name}```

Have fun!

PS: a dockerized version will follow soon, the image is already available on Docker Hub: https://hub.docker.com/repository/docker/saiyato/snapclient
Unfortunately auto-builds have been discontinued, so I need to find a way to push my images again, without having to pull out my laptop every time.