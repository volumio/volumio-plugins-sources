## Change Log

### Much was changed for version 2.x:

* Much cleaner codebase.  I now have a better sense of how Promises really work.  I was sort of winging it before for version 1.0.0.
* Tracks actually load up in the Volumio queue now and you can hop around and pick the ones you want.  The queue management was actually a bit tricky for me to iron out, but it should be working just fine now.
* Undesired bands/artists can be filtered by entering a percent (%) delimited string in the configuration, i.e. Megadeath%Abba%Korn
* No more volatile state.  The 1.0.0 plugin was updating the state every second.  It really was difficult to see what was going on with the constant barrage of state update log messages.
* Track data downloaded from Pandora only works for about an hour.  Track lifetime is now checked in the background and entries are deleted in a sane fashion in case the user does not listen to them in time.
* Dual-function Previous button option.  If enabled, a single press replays the current track, and a quick double-press goes to the previous track (when not in shuffle/random, otherwise a random track is played).

### Version 2.1.0:
  #### Changes
  * Actual support for Pandora One high-quality streams!  I took another look at this and I'm pretty sure that Pandora One users will get 192 Kbit/s streams now.  I do not have a premium subscription so if this does not work, please tell me.  It should, though, as the Unofficial Pandora API has a JSON of a sample playlist object on their site.  Free users like me are stuck with 128 Kbit/s.

### Version 2.1.2:
  #### Changes
  * Changed version number that npm didn't like (2.1.1.1).  This Readme was amended, mainly to clarify the experimental, mostly non-working, historical status of the pianode branch.  The installation steps were clarified.  A few things were fixed when the plugin closes (removing it from the Volumio Sources, stopping the track expiration loop).

### Version 2.3.0:
  #### Changes
  * Optional Thumbs-Down sent to Pandora for a track skipped by the Next media button.  The track is also removed from the queue like the sad thing it is.  Flip the switch in the plugin settings and kick the lame tracks to the curb!

### Version 2.3.4:
  #### Changes
  * Pausing a stream for too long will cause a timeout.  The plugin will detect this now and skip to the next track.  Curiously, this took a bit of work to implement.

### Version 2.4.0:
  #### Changes
  * Pandora logins expire after a few hours.  The plugin now logs in every so often to keep the authorization current.
  * Browse menu is now one level deep.  Choosing a station starts playback.  Tracks can be changed in the queue as before.
  * Optional queue flush after station change, configured in plugin options.

### Version 2.5.0:
  #### Changes
  * Removed maxQ constant that limited the number of total tracks fetched.
  * There is a per-station limit (otherwise it gets insane).  If that track limit is reached, a few of the oldest tracks are removed to make room for new tracks.

### Version 2.5.3:
  #### Changes
  * `Anesidora` was forked to enable premium Pandora account logins.  Thanks to @Jim_Edwards on the forum for the heads-up on premium login errors.

  #### Fixes
  * Refresh login credentials when idle and working reporting for login errors.

### Version 2.6.0:
  #### Changes
  * Separated PandoraHandler function and Timer classes into modules.  Song per-station "limit" value now in options.
  * <b>Serious queue voodoo:</b> When station is changed and old stations are retained, all tracks from the current station are moved and aggregated.
  * Some variables names were renamed for clarity.  Some variable types were changed as well (mainly `var`, `let` and `const`).  Log formatting was further standardized.

  #### Fixes
  * Green play arrow in queue no longer points incorrectly after a track expires.

### Version 2.7.0:
  #### Changes
  * Removed instruction to restart plugin after changing options.
  * Pandora API error codes are loaded.  They are logged and an error toast is pushed with the translated code.
  * Wrapped `setTimeout()` in the `siesta()` function to return a Promise.  Nested this function for setting intervals in `timers.js`.
  * Changing the plugin options triggers a new authorization attempt.  Restarting the plugin is no longer required.
  * Further cleaned up `Readme.md` (this document).

  #### Fixes
  * `onStart()` fix: `checkConfValidity()` was rejecting the Promise when there was an invalid or blank plugin configuration.  There was also a failed Promise in `onStop()`.<br/>
  Thanks to <b>@balbuze</b> for determining that the Promise failed in `onStart()` and `onStop()`.
  * The plugin loads after initial installation (with blank credentials).  After the credentials are entered in the options, the plugin attempts a login and starts if it succeeds.  Changes to the options take effect after they are saved (better now than in v2.6.0).
  * Small format changes to console output for `logInfo()`, `logError()`, and `generalReject()`.

### Version 2.7.1
  #### Fixes
  * `PandoraHandler::setCredentials` fix: Refreshing logins fails in v2.7.0.  In the `pandora` object, the `authdata` property is now set to null.   The `version` property has been added to the `partnerInfo` property for the `pandora` object.<br/>
  This was actually fixed before but was lost in the change from v2.6.0 to v2.7.0.

### Version 2.7.2
  #### Fixes
  * `ExpireOldTracks::fn` fix: Crash in vorhees() was causing a Volumio restart at the track expire interval.
  * `removeTrack` now returns a Promise if track is found unfit from removal (related to above bug).
  * If a different station track is selected from the Queue page, that track is not removed from the queue before starting playback -- it is played as expected.
  * `fetchAndAddTracks` was refactored.  The logic is much simpler now -- less queue math.  There may have been a bug there.
  * If a track from a different station was selected from the Queue page, its track length was at maxStationTracks, and the first of those tracks was selected, the tracks are now moved to the proper position (previously, the tracks were not moved until the next track played).

### Version 2.8.0
  #### Changes
  * Stations are indexed by the `stationToken` field.  This makes much more sense in case the station list changes due to addition or deletion of Pandora stations.
  * Measures are taken to handle a deleted or added station while this plugin is running.  Station data is periodically updated while the plugin is running.
  * MQTT option added.  A list of stations and the current station is optionally published to a MQTT broker.  This may be useful to users with home automation setups like [Home Assistant](https://home-assistant.io).
  * Pandora and MQTT functions were moved to `pandora_handler.js` and `mqtt_handler.js`.
  * Configuration menu is now split into three sections.
  * Some of the redundant logging wrappers, utility functions and constants were moved to `helpers.js` and `common.js`.
  * `this` context is handled more cleanly in the dependent modules.  `that` is now `self` and `that.self.<ControllerPandoraFunction>` (which was defintely confusing) is now `self.context.<ControllerPandoraFunction>`.

### Version 2.8.1
  #### Fixes
  * `PandoraHandler::setMQTTEnabled` fix: Error in variable name caused `PandoraHandler::fillStationData` to skip publishing `self.stationData` to MQTT broker.

### Version 2.9.0
  #### Changes
  * `PandoraHandler::setMQTTEnabled` now starts stationDataHandler timer to periodically publish station data as a JSON to MQTT if flag is enabled in options.
  * `setCurrStationInfo` now publishes `stationName` as a JSON.

### Version 2.9.1
  #### Fixes
  * Fixed the band filter processing.
  * Cleaned up `moveStationTracks`.
  * `PandoraHandler::setBandFilter`, `PandoraHandler::setMaxStationTracks`, and
    `PandoraHandler::getNewTracks` now return a Promise.

### Version 2.9.2
  #### Fixes
  * Fixed problem fetching tracks in `handleBrowseUri`.  Call to getNewTracks is now different due to returned Promise.
  * Small logging fix in `fetchAndAddTracks`.

### Version 2.9.3
  #### Changes
  * Only change was to `package.json` for Volumio 3

### Version 2.10.1
  #### Changes
  * Stations can now be sorted by Newest, Oldest, Alphabetical or Reverse Alphabetical order.  I had the sorts ready but had not implemented them.  @HeadGeek's request put the matches under my feet.
  * Icons were slightly changed in the browse screen.

### Version 2.10.2
  #### Changes
  * Resized the Pandora icon to 45% of former size to better match other Volumio icons.  The former size was due to remedial image processing skills by yours truly.  Suggested by @davestlou.

### Version 2.10.3
  #### Fixes
  * Changed Pandora icon from grayscale to black and white to fit the Volumio standard (I did not see the comment on GitHub until a few days ago).

### Version 2.11.1
  #### Fixes
  * `PandoraHandler::thumbsDown()` was not working (`self` was declared as `const`).  Function was refactored to `PandoraHandler::thumbTrack()` and `PandoraHandler::addFeedback()` to allow for both Thumbs Up and Thumbs Down.
  * `thumbTrack()` is now exposed / can be called from WebSocket API et al.
  #### Changes
  * `PandoraHandler::reportAPIError()`: refactored logging.
  * `goPreviousNext()`: When `(nextIsThumbsDown == true && qPos == qLen - 1)` -- Fetch more tracks before removing last track from queue -- Otherwise an error might occur or playback might stop?

### Version 2.11.2
  #### Fixes
  * `handleBrowseUri()` would not render a page if the user was not logged in to the Pandora servers / plugin settings were incorrect.  A warning toast is now sent and an information message is rendered in the browse page.  Thanks @balbuze
  #### Changes
  * `validateAndSetAccountOptions()` and `initialSetup()` were refactored to improve the initialization / authentication to the Pandora servers.
  * `PandoraHandler::getLoginStatus()` function was created.
  * `PandoraHandler::pandoraLoginAndGetStations` and `PandoraHandler::fillStationData` were refactored.
  * `Timer` class logging now indicates delayed start status.
  * `Timer::PreventAuthTimeout` class now delays its startup.

### Version 2.12.1
  #### Fixes
  * The `resume()` function was fixed.  The Volumio `state.status` object key was not being updated to 'play'.  Pausing and resuming should work much better now.  Thanks to @GlennBurnett in the forums for pinpointing this old bug.
  * Stopping / Deactivating the plugin will (should!) clear the "ghost" album cover thumbnail and metadata from Volumio's GUI.  @downtownHippie asked me to fix this a long time ago and it was bugging me even before he mentioned it.  I have been chasing this bug for years now and I hope that it is finally gone!
  * Fixed an error in `pushState()` that wasn't updating the status correctly after a pause. Thanks to @GlennBurnett who alerted me to this issue and helped me fix it.
  * The "No results" red error toast when choosing a station has been fixed -- there was no final "response" returned from `handleBrowseUri()`.
  * `previous()` and `next()` functions were revisited due to changes to the `stop()` function.  Thanks to @davestlou for pointing this out.

### Version 2.12.2
  #### Fixes
  * If there were other track types in the Volumio queue (local MP3 tracks, data from other plugins, etc.), the Pandora tracks would not expire when another Pandora track was selected.
  * Plugin now checks for Internet connectivity (thanks @dep) before starting (pings Google, then tries to reach the Google webpage).  Some users are using machines that bring up the plugin before Volumio is connected to the network.
  #### Changes
  * `Readme.md` was revised and the manual installation instructions were split off to [Manual_Installation.md](Manual_Installation.md).  Changes and Fixes were moved to [CHANGELOG.md](CHANGELOG.md).
  * Ordering by date was refactored but gives identical results here.  Previously, it was based on the `stationToken` integer field and now is based on the `dateCreated` field.
  * `is_active()` function added to the `Timer` class.
  * New dependencies: `node-fetch@2.0` and `ping`.