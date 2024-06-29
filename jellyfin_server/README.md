# Jellyfin Server plugin for Volumio

This plugin installs the [Jellyfin](https://jellyfin.org/) media server app on your Volumio device. The server starts when the plugin is enabled.

The plugin has been tested on Volumio 3 running on a Raspberry Pi 3b (`armhf` architecture) and x86 PC (`x86_64 / amd64` architecture). For performance reasons, do not install the plugin on devices with less than 1GB RAM. Jellyfin is not exactly lightweight and poor performance due to insufficient memory can in turn lead to stability issues.

>Although the plugin runs reasonably well on the Raspberry Pi 3b with 1GB RAM, 2GB or more is in fact recommended.

## Initial Setup

1. Install the plugin through the Volumio plugin store. Depending on your hardware and network speed, the installation process can take some time.

2. After installation, enable the plugin. You will be notified when the server has started.

3. Go to the plugin settings and click the "Open URL" button. You will be redirected to Jellyfin's first-time configuration wizard.

    > If you get a Page Not Found error, this could be because the server has not yet fully loaded. Wait a few minutes and try again.

    > If you get presented with a "Select Server" page, try clearing Cookies and Site Data for the URL shown in the browser window, followed by refreshing the page. If this doesn't help, click the "Add Server" button and manually enter the URL of your Jellyfin server. The URL can be copied and pasted from the "URL" field of the plugin settings (which is typically `http://<your volumio address>:8096`).

4. Follow the steps of choosing language and creating an admin account. You will then arrive at "Setup your media libraries". You can add a music library at this stage, but for the purpose of this guide we will skip it for now and cover it in the next section. So, click "Next" and follow the steps until you reach the end of the configuration. If you come across the "Allow remote connections to this server" option, make sure you leave it checked.

5. After completing the first-time configuration, you will be redirected to the sign-in page. Enter the username and password of the admin account you created just then.

## Adding a Music Library

When you go to Volumio's Music Library, you can see the following folders where media is stored:

1. INTERNAL: for media stored on Volumio's internal storage

2. NAS: for media stored on NAS shares added to Volumio

3. USB: for media stored on USB devices attached to Volumio

In this section, you will create a music library in Jellyfin and add content from these folders. Before we start, take note of the following:

1. You can create multiple libraries in Jellyfin, with each containing media from one or more folders (directories).

2. Two libraries cannot share the same folder. For example, if you add `INTERNAL/My Pop Collection` to `Library1`, followed by adding the same folder to `Library2`, then only one of `Library1` or `Library2` will show content from the folder.

3. It follows that, if you create `Library3` and simply add the `INTERNAL` folder to it, then only one of `Library1`, `Library2` or `Library3` will show content from `INTERNAL/My Pop Collection`. This is because the folder is a subfolder of `INTERNAL` and will be seen as duplicate by the scanning process of `Library3`.

To add a music library, do the following:

1. On the Jellyfin landing page (after you have signed in), open the menu by clicking the hamburger icon in the top-left corner. Go to Admin -> Dashboard.

2. Select Server -> Libraries, then click "Add Media Library".

3. Choose "Music" for Content Type (important) and give your library a name. 

4. Click the (+) button next to "Folders".

    - In the "Select Path" form, click the slash `/` to go to the root folder.

    - You will see a folder called "mnt". Select it and you will see the INTERNAL, NAS and USB subfolders. These correspond to folders of the same name in Volumio's Music Library.

    - Navigate through the folders and click "OK" when you have reached the folder you would like to add. The contents of the folder, including its subfolders, will be scanned and found media will be added to the library.

5. After a folder is added, you can add another by repeating step 4. When you are done, click "OK".

That's it -- you have created a music library. The scanning process will begin and you can monitor the overall progress in Server -> Dashboard.

### Real-time monitoring

When you add a music library, real-time monitoring is enabled by default. When you change content of a folder that is part of a library, such as adding or removing media, the library will be refreshed automatically. If for some reason a library fails to refresh, you can force one by going to the Dashboard and clicking "Scan All Libraries".

>Real-time monitoring is dependent on the filesystem. For example, NFS filesystems are not supported and you would have to do the "Scan All Libraries" routine whenever you change something on an NFS mount.

### Adding NAS shares, mounting USB devices, etc.

These actions are handled by Volumio. So if you want to add an NAS share, for instance, you would have to go to Volumio's interface and do it in Settings -> Sources.

Basically, Jellyfin can only see whatever drives and disks Volumio sees. If Volumio fails to recognize a USB device or mount an NAS share, then Jellyfin will not be able to access them either.

## Using in conjunction with Jellyfin plugin

The Jellyfin plugin for Volumio (note: without the word "Server") allows you to browse music libraries hosted on a Jellyfin server through Volumio's UI and stream audio in native format. You can install the Jellyfin plugin in Volumio's plugin store, then:

1. Copy the value of the "URL" field in Jellyfin **Server** plugin settings.

2. In Jellyfin plugin settings (*not* the server plugin), paste the copied value to "Host" under "Add a Server". Enter the username and password of your Jellyfin server's admin account, then click the "Add" button.

> Starting from Jellyfin plugin v0.1.6, you can skip step 1 and simply enter `http://localhost:8096` in the "Host" field.

You should now see the server when you browse the Jellyfin source. Selecting it will gain you access to the hosted music libraries.

## Connecting with other Jellyfin clients

The Jellyfin plugin for Volumio introduced above is just one of the many [clients available for Jellyfin](https://jellyfin.org/clients/). In fact, when you click the "Open URL" button in the Jellyfin Server plugin settings, you are brought to the Jellyfin web client. From there, you can browse your libraries and play content locally on your browser.

If you have the Jellyfin mobile app installed on your phone, you can connect to the server running on Volumio and play songs on your phone, *provided they are on the same network*.

> Recap: the URL used by a client for connecting to the Jellyfin server running on Volumio is the value of the "URL" field in the Jellyfin Server plugin settings. This is typically `http://<your volumio address>:8096`.

## FAQ

**Can I connect to Jellyfin from outside my network?**

It is possible, but details on how to do it **safely** is beyond the scope of this project.

If you are thinking of configuring port forwarding on your router to direct external requests to Volumio (and the Jellyfin server running on it), then **STOP THINKING FURTHER!** Creating a zero-security passage from the World Wide Web to a zero-security device on your network is a really bad idea. Instead, research on "reverse proxy" or "setup VPN" for better ideas.

## Changelog

1.0.2:
- Install [jellyfin-ffmpeg](https://github.com/jellyfin/jellyfin-ffmpeg) - required since FFmpeg version provided by Volumio is too old (metadata missing due to `ffprobe` failures)

1.0.1:
- Fix broken package URL ([#3](https://github.com/patrickkfkan/volumio-jellyfin-server/issues/3)) and update Jellyfin target version
- Jellyfin version installed: 10.9.6

1.0.0:
- Migrate to TypeScript
- Jellyfin version installed: 10.8.10

0.1.3:
- Remove use of Docker since container created from Jellyfin image fails to start on Raspberry Pi 4.
- Jellyfin version installed: 10.8.3

> If you are running a previous version of the plugin, please uninstall it first to remove the Docker-related files. If you simply "update" to this version, you will have files leftover from the previous version.

0.1.2:
- Improve compatibility with Music Services Shield plugin

0.1.1:
- Improve robustness of (un)installation process
- Improve fetching of server stats
- Jellyfin version installed: 10.8.0

0.1.0:
- Initial release
- Jellyfin version installed: 10.7.7


## License

MIT