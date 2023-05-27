# Plex and PlexAmp plugin

This ia fork of the Plexamp plugin by Jerome O'Flaherty (jeromeof) at
https://github.com/jeromeof/volumio-plugins-sources

Jerome has not updated the code since November 2022 (as of late May
2023) and I (incorrectly) did not see his updates on the Plex community
thread declaring his intention to make further changes.

When I tried to run his last published code on my own Raspberry Pi 3b
running Volumio 3.449, it could not detect my personal Plex Server running
on FreeBSD on my private home network.  I decided to fork the code and
investigate.

I found a few problems:

A.  The plugin configuration code gets Plex Media Server data from plex.tv
and then uses ICMP ping to determine if any of the servers on that plex.tv
provides are active and reachable.  It uses a library called 'net-ping'
to perform the ping.  This caused two problems.

1. 'net-ping' depends on a package called 'raw-socket' to perform low
level networking tasks. Changes in embedded Linux for Volumio 3 prevents
raw-socket from working properly unless the executable running is blessed
with additional security privileges using setcap:

setcap cap_net_broadcast,cap_net_admin,cap_net_bind_service,cap_net_raw+eip /usr/bin/node

see: https://github.com/nospaceships/node-raw-socket/issues/53

2. 'raw-socket' also appears to cause the nodejs thread running it to
exit silently.  This has issue has been open for over a year.  It is
speculated that it caused by how raw-socket schedules events and those
events are being memory garbage collected.

see: https://github.com/nospaceships/node-raw-socket/issues/70

Both of these problems cause the setup of the plugin configuration screen to
silently exit mid-process, preventing my local Plex media server from being
detected.  Instead, localhost (127.0.0.1) was used (where a local PlexAmp
service could, theoretically, be running.)  This failed.

B. The plugin setup process gathers data about associated Plex meda servers
using the URL https://plex.tv/pms/servers .  This URL only provides information
about media servers that have Remote Access activated.  My local server
did not, and that prevented it from being detected.

C. Server information from https://plex.tv/pms/servers is provded as data in
XML format.  Server information so gathered is exposed to the rest of the
code as more or less raw parsed XML data rather than a regular interface
structure.

D. The constructed Plex interface did not provide access to music the way
I most often access my music: listed as Albums by Artist.

E. Links within the Plex interface to album pages were broken wherever ablums
were provided in a list (recently added albums, recently played albumbs,
artist pages, etc...)  The process to generate those album pages looked
for "related albums" and required that information be provided by Plex.
My media server did not provide that information and the page generation
process broke.

F. When I attempted to test with a Plex server in the AWS EC2 cloud to
test a server with Remote Access enabled, the plugin setup would not detect
the music library on that media server.  This is again caused by ICMP ping.
The public network interface did not accept and respond to ICMP traffic.
Its contents were rejected because the server was not seen to be alive.

G. The label on the Music Libary options pull down always defaults to the
first item provided by Plex.tv regardless of what libary is actually being
used.  This is because a port number was being loaded as a number when the
code needed it to be loaded as string.

These problems were all fixed:

A. I replaced the 'net-ping' NPM module the 'ping' module, at first.
It was later replaced by a different method entirely (see below).

B. I switched from gathering data at https://plex.tv/pms/servers to
https://plex.tv/pms/resources . The latter link provides information about
all media servers associated with Plex account, whether Remote Access is
enabled or not.

C. I created a simple interface struct to pass data, rather than providing
it raw.

D. I added an Albums search link to the top level of the Plex page.

E. I made the use of related album information optional, and only used
in page generation when it is present.

F. I replaced the ICMP ping method to detect server presence with one
that queries the media server HTTP interface.  The server and service is
running when a HTTP response (usually 401 not authorized) is received
within one second.

G. I made sure the port value read from the plugin config file is stored
as a string.

Aside from these direct fixes, I felt that the mix of kew library promise
fuctionality at the try/catch (or .then/.catch) semantics used in the
PlexPinAuth object were making code for the ControllerPlexAmp object
more complicated than it needed to be.

I converted PlexPinAuth to return kew promises, and reorganized code in
ControllerPlexAmp (especially in getPinAndUpdateConfig where if..then..else
and .catch logic was concentrated into a single .fail block.)

### Future Work

- This code really needs some real unit testing.  A lot of these problems
should have been found in code coverage tests.  That will require constructing
some mocks of Plex.tv and media server http interfaces, as well as a way to
inject those URLS into the actual plugin setup code.

- Remote server access needs to use https instead of http.  This is untested
at this point.

- This needs to be tested with different versions of Volumio and/or different
versions of Raspberry Pi.

- Along with the test mocks, some tracing messages would be very helpful.

- It would be nice if music plays by this plex client actually updated any
recently played lists on the media server.

- Some album art is missing.  Can this be better handled?  I don't know.

- Running PlexAmp on the local Raspberry Pi remains untested.

# jeromeof's original README

### Version History
- 1.0.1 - Initial Version with following capabilities:
  1. Pair with Plex 'cloud' using Code
  2. Select a particular Music Library on a specific Plex Server
  3. Browse and play from:
     1. any Plex playlist
     3. Recently added artists 
     4. Recently added artist 
     4. Recent played albums
     5. Recently added Albums
     6. All Artists
  6. Search Plex for Albums, Artists and Songs
  7. View extra information about Artists and Albums 

### Upcoming features
-  Download and install PlexAmp 4.2.2
- Add translations 
- Remote Plex Servers
- Better organisation for Artists and Albums
- Add Genres and other Metadata from Plex

### Roadmap features:
1. Support Bullseye builds of Volumio
2. Support Plexamp 4.3+ (requires Bullseye)
3. Align with Plexamp when Plex upgrades Node support in Headless Plexamp
4. Implement Plex Native 'Player' 
   
