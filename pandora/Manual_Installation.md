# Manual Installation Instructions

## Getting Started

First you'll need to SSH to your Volumio machine.<br/>
To enable SSH access, browse to http://volumio.local/dev and turn it on.

Make sure your system clock is set properly.  This command set you up for regular clock updates:<br/>

`sudo timedatectl set-ntp true`

### Downloading the Source Code from GitHub

Connect to your Volumio machine.<br/>
Use PuTTY on Windows or some equivalent.<br/>
Mac users can use a terminal window, ask a search engine for help, or visit an Apple store.<br/>
Linux users, you're fine.

<b>Username:</b> `volumio`<br/>
<b>Password:</b> `volumio`<br/>

Then, clone the repository:

`git clone https://github.com/truckershitch/volumio-plugins-sources.git`

### Optional (not recommended):
There are two older versions archived on GitHub.  If you want to try out another branch, change to the `volumio-plugins-sources` directory:

`cd volumio-plugins-sources`

The pianode branch is the oldest <b>and works the least</b>.  I have not tested it on the newer Volumio releases.<br/>
<b>It may break your system.  It probably won't work.</b>

~~To try your luck with the version based on pianode, do this:~~

~~`git checkout pianode`~~

~~To try out version 1.0.0 that uses the volatile state (works but not perfectly), do this:~~

~~`git checkout v1.0.0`~~

Otherwise, just continue below (don't bother with checking out anything).  To switch back to the main master branch if you checked out another one, do this:

`git checkout master`

Or you can just delete the `volumio-plugins-sources` directory.

## Continuing with Installation

<b>To upgrade from an older plugin version:</b>

`cd /path-to/volumio-plugins-sources/pandora`<br/>
`volumio plugin update`

<b>For a fresh installation:</b>

`cd /path-to/volumio-plugins-sources/pandora`<br/>
`volumio plugin install`

Both of these two commands stop for me after 100%.  I'm not sure why; if you look at `install.sh`, it's pretty empty.  Weird.  The operations succeed.

<b>No worries!</b>  Just hit `Control-C`.