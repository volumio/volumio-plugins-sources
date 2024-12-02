Description

The SleepWake Plugin for Volumio is designed to automate scheduled sleep and wake-up routines for the system. It allows users to set specific times for the system to go into a "sleep" state (fade out the volume and stop playback) and a "wake" state (gradually increase the volume and start a playlist). The schedule can be customized for weekdays, Saturdays, and Sundays. The plugin also lets users adjust settings like volume fade speed, ramp-up duration, and initial volume levels.
_____________________________________________________________________________________  
```
+-----------------------------------------------------------+
| Sleep Wake Schedule Plugin Configuration                  |
+-----------------------------------------------------------+
|                                                           |
----[ 🌜 Night Mode ]-------------------------------------- 
|                                                           |
| Mon-Fri Sleep Time (HH:MM)      [     22:00             ] |
| Saturday Sleep Time (HH:MM)     [     22:00             ] |
| Sunday Sleep Time (HH:MM)       [     22:00             ] |
| How Much Volume to Decrease     [       10              ] |
| Fade Out (Minutes)              [       10              ] |
|                                                           |
|                        [ Save ]                           |
|                                                           |
------------------------------------------------------------
|                                                           |
----[ ☀️ Morning Mode ]------------------------------------- 
|                                                           |
| Mon-Fri Wake Time (HH:MM)       [     07:00             ] |
| Saturday Wake Time (HH:MM)      [     07:00             ] |
| Sunday Wake Time (HH:MM)        [     07:00             ] |
| Start Volume                    [       35              ] |
| Playlist Name                   [   WakeUp List         ] |
| Volume Much Volume to Increase  [       10              ] |
| Ramp Up (Minutes)               [       10              ] |
|                                                           |
|                        [ Save ]                           |
|                                                           |
+-----------------------------------------------------------+
```


______________________________________________________________________________________
Key Features:

Sleep Scheduling:
Gradually fades out the system volume over a user-defined duration until it reaches zero, then stops playback.
Users can configure different sleep times for weekdays, Saturdays, and Sundays.

Wake Scheduling:
Gradually increases the system volume to a target level and starts playing a specified playlist.
Separate wake times can be set for weekdays, Saturdays, and Sundays.

User Settings:
Settings include sleep/wake times, volume adjustments, fade duration, playlist selection, and more.
Configurations are saved to a JSON file and can be updated through the Volumio user interface.
Interaction Between Sleep and Wake Processes
1. Sleep Process (fadeOutVolume)
When the sleep process is initiated, the system starts decreasing the volume in small steps based on the volumeDecrease and minutesFade settings.
The volume is reduced gradually until it reaches zero, after which playback is stopped.
Interruption Handling: If the wake process is triggered while the system is still fading out to sleep, the sleep process is interrupted. This ensures that waking up takes priority, allowing music to start playing immediately with a volume ramp-up.
2. Wake Process (startPlaylist)
The wake process starts by setting the volume to a specified initial level (startVolume) and then playing a selected playlist.
It then gradually increases the volume to the desired level using the volumeIncrease and minutesRamp settings.
Interruption Handling: If the sleep process is triggered while the system is waking up (i.e., while the volume is still increasing), the wake process is interrupted. This prevents the system from trying to fade out the volume while it is simultaneously increasing it.
Detailed Logic for Sleep and Wake Interactions
The fadeOutVolume() function checks if the system is currently in the waking state before starting the sleep process. If the system is waking up, the sleep process is not allowed to proceed.

javascript code:

if (self.isWaking) {
  self.logger.warn('Cannot start sleep during wake-up process.');
  self.writeLog('Cannot start sleep during wake-up process.');
  return;
}
Similarly, in the startPlaylist() function, if the system is currently in the sleeping state, it stops the sleep process, clears any active sleep timers, and then proceeds with waking up.

javascript code:

if (self.isSleeping) {
  self.logger.info('Interrupting sleep to start wake-up.');
  self.writeLog('Interrupting sleep to start wake-up.');
  if (self.sleepTimer) {
    clearTimeout(self.sleepTimer);
    self.writeLog('Cleared sleep timer.');
  }
  self.isSleeping = false;
}


Scheduling Logic

The sleep and wake schedules are managed by the functions scheduleSleep() and scheduleWake(), which parse the configured times and set timers accordingly.
If the scheduled time has already passed for the current day, the plugin adjusts the schedule to the next day.
Configuration Management
The plugin uses a configuration file (config.json) to store user preferences.
The settings include:
Mon_Fri_sleepTime, Sat_sleepTime, Sun_sleepTime
Mon_Fri_wakeTime, Sat_wakeTime, Sun_wakeTime
startVolume, playlist, volumeDecrease, minutesFade, volumeIncrease, minutesRamp
Error Handling & Logging
The plugin logs all significant events, errors, and actions to a log file (sleep-wake-plugin.log), making it easier to troubleshoot issues.
Additional checks are in place to validate the time formats, handle network errors during REST API calls, and gracefully handle any interruptions in the sleep/wake processes.

_____________________________________________________________________________________
Installation Instructions

Follow these steps to install the Sleep-Wake Schedule Plugin for Volumio:

*Clone the Repository:*    git clone https://github.com/mivanci5/Sleep-Wake-Schedule-Volumio-Plugin.git

Navigate to the directory where you want to clone the repository and execute the above command.

*Navigate to the Plugin Directory:*    cd Sleep-Wake-Schedule-Volumio-Plugin

*Install pugin with comand:*   volumio plugin install

*Enable Plugin*

Go to the Volumio web UI.

Navigate to Plugins.

Find the Sleep-Wake Schedule Plugin under System.

Click Enable.

if problem with  starting or saving settings restart volumio
*restart command:* volumio vrestart

__________________________________________________________________________________
Configuration Instructions

Once the plugin is enabled, you can configure the sleep and wake-up schedules from Volumio's user interface:

Access Plugin Settings:

In the Volumio web UI, navigate to Settings > Plugins > System > Sleep-Wake Schedule Plugin.

Sleep and Wake Settings:

Sleep Settings: Set the time for the system to enter sleep mode (e.g., fade volume for 10% and stop playback).

Wake Settings: Configure the wake-up time, start volume, playlist, and how quickly the volume should increase.


_________________________________________________________________________________
Usage Example

Set Sleep Time to 22:30, with a gradual volume decrease over 15 minutes.

Configure Wake Time to 07:00, starting at volume level 20, and play your favorite morning playlist. While volume inceises for 20min.


_________________________________________________________________________________
Troubleshooting

Settings Not Saved: If the settings don't appear to save, ensure you have clicked the Save button after making changes. You may need to restart Volumio for changes to take effect.

Logs: Check the plugin log file (sleep-wake-plugin.log) located in the plugin's directory for detailed information regarding the plugin's operation. The plugin logs events such as saving settings, scheduled sleep/wake operations, and errors.


_________________________________________________________________________________
License

This plugin is released under the ISC License.


_________________________________________________________________________________
Conclusion

This plugin offers robust scheduling features for automated sleep and wake routines in Volumio, making it ideal for users who want to automate their music listening schedules. The seamless handling of conflicts between sleep and wake processes ensures smooth transitions, prioritizing wake-up over sleep when necessary.
