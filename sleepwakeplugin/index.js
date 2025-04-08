'use strict';

const libQ = require('kew');
const fs = require('fs-extra');
const path = require('path');
const config = new (require('v-conf'))();
const os = require('os');
const http = require('http');
const MAX_LOG_SIZE = 2 * 1024 * 1024; // 2 MB

module.exports = SleepWakePlugin;

function SleepWakePlugin(context) {
  const self = this;

  self.context = context;
  self.commandRouter = self.context.coreCommand;
  self.logger = self.context.logger;
  self.configManager = self.context.configManager;

  // Path to the log file
  self.logFile = path.join(__dirname, 'sleep-wake-plugin.log');

  // State flags
  self.isSleeping = false;
  self.isWaking = false;
}

SleepWakePlugin.prototype.onVolumioStart = function () {
  const self = this;

  self.logger.info('SleepWakePlugin - onVolumioStart');
  self.writeLog('Plugin starting...');

  const configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
  self.config = new (require('v-conf'))();
  self.config.loadFile(configFile);
  self.writeLog('Config file path: ' + configFile);
  return libQ.resolve();
};

SleepWakePlugin.prototype.onStart = function () {
 
  const self = this;
  const defer = libQ.defer();

  self.logger.info('SleepWakePlugin - onStart');
  
  self.manageLogSize();  // cheking log size
  
  self.writeLog('Plugin started.');

  self.loadConfig();

  self.writeLog('Next is ScheduleSleep function.');
  self.scheduleSleep();
  self.writeLog('Next is ScheduleWake function.');
  self.scheduleWake();

  defer.resolve();
  return defer.promise;
};

SleepWakePlugin.prototype.onStop = function () {
  
  const self = this;
  const defer = libQ.defer();

  self.logger.info('SleepWakePlugin - onStop');
  self.writeLog('Plugin stopped.');

  // Clear timers
if (self.sleepTimer !== undefined) {
  clearTimeout(self.sleepTimer);
  self.writeLog('Cleared existing sleep timer.func onStop');
  self.sleepTimer = undefined;
}
if (self.wakeTimer !== undefined) {
  clearTimeout(self.wakeTimer);
  self.writeLog('Cleared existing wake timer.func onStop');
  self.wakeTimer = undefined;
}

  // Reset state flags
  self.isSleeping = false;
  self.isWaking = false;

  defer.resolve();
  return defer.promise;
};

// Get data for settings GUI
SleepWakePlugin.prototype.getUIConfig = function () {
  const self = this;
  const defer = libQ.defer();

  self.logger.info('SleepWakePlugin - getUIConfig');
  self.writeLog('Loading UI configuration.');

  self.loadConfig();
  const uiconfPath = path.join(__dirname, 'UIConfig.json');

  fs.readJson(uiconfPath, function (err, uiconf) {
    if (err) {
      self.logger.error('SleepWakePlugin - Error reading UIConfig.json: ' + err);
      self.writeLog('Error reading UIConfig.json: ' + err);
      defer.reject(new Error());
      return;
    }

    try {
      // Seting values for Mon-Fri, Satarday and Sunday
      uiconf.sections[0].content[0].value = self.config.get('Mon_Fri_sleepTime') || '22:00';
      uiconf.sections[0].content[1].value = self.config.get('Sat_sleepTime') || '22:00';
      uiconf.sections[0].content[2].value = self.config.get('Sun_sleepTime') || '22:00';
      uiconf.sections[0].content[3].value = self.config.get('volumeDecrease') || 10;
      uiconf.sections[0].content[4].value = self.config.get('minutesFade') || 5;

      uiconf.sections[1].content[0].value = self.config.get('Mon_Fri_wakeTime') || '07:00';
      uiconf.sections[1].content[1].value = self.config.get('Sat_wakeTime') || '07:00';
      uiconf.sections[1].content[2].value = self.config.get('Sun_wakeTime') || '07:00';
      uiconf.sections[1].content[3].value = self.config.get('startVolume') || 20;
      uiconf.sections[1].content[5].value = self.config.get('volumeIncrease') || 1;
      uiconf.sections[1].content[6].value = self.config.get('minutesRamp') || 10;


      // Additional log to verify values retrieved from config
      self.writeLog('Configuration values loaded for UI: Mon_Fri_sleepTime: ' + uiconf.sections[0].content[0].value);
      self.writeLog('Sat_sleepTime: ' + uiconf.sections[0].content[1].value);
      self.writeLog('Sun_sleepTime: ' + uiconf.sections[0].content[2].value);
      self.writeLog('volumeDecrease: ' + uiconf.sections[0].content[3].value);
      self.writeLog('minutesFade: ' + uiconf.sections[0].content[4].value);
      self.writeLog('Mon_Fri_wakeTime: ' + uiconf.sections[1].content[0].value);
      self.writeLog('Sat_wakeTime: ' + uiconf.sections[1].content[1].value);
      self.writeLog('Sun_wakeTime: ' + uiconf.sections[1].content[2].value);
      self.writeLog('startVolume: ' + uiconf.sections[1].content[3].value);

      self.writeLog('volumeIncrease: ' + uiconf.sections[1].content[5].value);
      self.writeLog('minutesRamp: ' + uiconf.sections[1].content[6].value);

     // Get saved playlist from config.json
      const currentPlaylist = self.config.get('playlist');

      // Get playlist from Volumio API
      self.fetchPlaylists()
        .then((playlists) => {
          // Set options in UI settings
          uiconf.sections[1].content[4].options = playlists;

          // IF list from Config.json exist in volumio playlists, then set it for wake up
          if (currentPlaylist) {
            const selectedPlaylist = playlists.find(pl => pl.value === currentPlaylist);
            if (selectedPlaylist) {
              uiconf.sections[1].content[4].value = selectedPlaylist;
              self.writeLog(`Playlist found and set: ${selectedPlaylist.value}`);
            } else {
              self.writeLog(`Playlist not found in options, setting to default.`);
              uiconf.sections[1].content[4].value = { value: '', label: '' };
            }
          } else {
            uiconf.sections[1].content[4].value = { value: '', label: 'Select a playlist' };
          }

          defer.resolve(uiconf);
        })
        .catch((fetchError) => {
          self.logger.error('Error fetching playlists: ' + fetchError);
          self.writeLog('Error fetching playlists: ' + fetchError);
          defer.resolve(uiconf);
        });
      
    } catch (parseError) {
      self.logger.error('SleepWakePlugin - Error parsing UIConfig.json: ' + parseError);
      self.writeLog('Error parsing UIConfig.json: ' + parseError);
      defer.reject(new Error());
    }
  });

  return defer.promise;
};



// Save data to Config.json
SleepWakePlugin.prototype.saveOptions = function (data) {
  const self = this;
  
  self.logger.info('SleepWakePlugin - saveOptions');
  self.writeLog('Saving options. Data received: ' + JSON.stringify(data));

  // Extract values from data
  const sleepTime_Mon_Fri = data['Mon_Fri_sleepTime'];
  const sleepTime_Sat = data['Sat_sleepTime'];
  const sleepTime_Sun = data['Sun_sleepTime'];
  const wakeTime_Mon_Fri = data['Mon_Fri_wakeTime'];
  const wakeTime_Sat = data['Sat_wakeTime'];
  const wakeTime_Sun = data['Sun_wakeTime'];
  const startVolume = data['startVolume'];
  const playlist = data['playlist'];
  const volumeDecrease = data['volumeDecrease'];
  const minutesFade = data['minutesFade'];
  const volumeIncrease = data['volumeIncrease'];
  const minutesRamp = data['minutesRamp'];

  // Save sleep and wake settings for different days
  if (sleepTime_Mon_Fri !== undefined) {
    self.config.set('Mon_Fri_sleepTime', sleepTime_Mon_Fri);
    self.writeLog('Set Mon_Fri_sleepTime to ' + sleepTime_Mon_Fri);
  }
  if (sleepTime_Sat !== undefined) {
    self.config.set('Sat_sleepTime', sleepTime_Sat);
    self.writeLog('Set Sat_sleepTime to ' + sleepTime_Sat);
  }
  if (sleepTime_Sun !== undefined) {
    self.config.set('Sun_sleepTime', sleepTime_Sun);
    self.writeLog('Set Sun_sleepTime to ' + sleepTime_Sun);
  }
  if (wakeTime_Mon_Fri !== undefined) {
    self.config.set('Mon_Fri_wakeTime', wakeTime_Mon_Fri);
    self.writeLog('Set Mon_Fri_wakeTime to ' + wakeTime_Mon_Fri);
  }
  if (wakeTime_Sat !== undefined) {
    self.config.set('Sat_wakeTime', wakeTime_Sat);
    self.writeLog('Set Sat_wakeTime to ' + wakeTime_Sat);
  }
  if (wakeTime_Sun !== undefined) {
    self.config.set('Sun_wakeTime', wakeTime_Sun);
    self.writeLog('Set Sun_wakeTime to ' + wakeTime_Sun);
  }

  if (startVolume !== undefined) {
    const volumeValue = parseInt(startVolume, 10);
    if (isNaN(volumeValue)) {
      self.logger.error('SleepWakePlugin - Invalid startVolume value: ' + JSON.stringify(startVolume));
      self.writeLog('Invalid startVolume value: ' + JSON.stringify(startVolume));
    } else {
      self.config.set('startVolume', volumeValue);
      self.writeLog('Set startVolume to ' + volumeValue);
    }
  }

    // Save the playlist as string 
  if (playlist !== undefined) {
    const playlistName = typeof playlist === 'object' && playlist.value ? playlist.value : playlist;
    self.config.set('playlist', playlistName);
    self.writeLog('Set playlist to ' + playlistName);
  }

  if (volumeDecrease !== undefined) {
    self.config.set('volumeDecrease', volumeDecrease);
    self.writeLog('Set volumeDecrease to ' + volumeDecrease);
  }
  if (minutesFade !== undefined) {
    self.config.set('minutesFade', minutesFade);
    self.writeLog('Set minutesFade to ' + minutesFade);
  }
  if (volumeIncrease !== undefined) {
    self.config.set('volumeIncrease', volumeIncrease);
    self.writeLog('Set volumeIncrease to ' + volumeIncrease);
  }
  if (minutesRamp !== undefined) {
    self.config.set('minutesRamp', minutesRamp);
    self.writeLog('Set minutesRamp to ' + minutesRamp);
  }
  
    // Stop all fading and rumpup and scheduleSleep and ScheduleWake
  if (self.isSleeping) {
     self.writeLog('Interrupting active sleep process.');
    self.isSleeping = false;
  }
  
  if (self.isWaking) {
    self.writeLog('Interrupting active wake process.');
    self.isWaking = false;
  }
  
    // Clear timers
  if (self.sleepTimer !== undefined) {
    clearTimeout(self.sleepTimer);
    self.writeLog('Cleared existing sleep timer.func saveOption');
    self.sleepTimer = undefined;
  }
  if (self.wakeTimer !== undefined) {
    clearTimeout(self.wakeTimer);
    self.writeLog('Cleared existing wake timer.func saveOption');
    self.wakeTimer = undefined;
  }

  // Save configuration to disk
  self.config.save();
  self.writeLog('Configuration saved.');

  self.loadConfig(); // Load new config before starting wake and sleep process
  // Re-schedule sleep and wake processes
  self.scheduleSleep();
  self.scheduleWake();

  self.commandRouter.pushToastMessage('success', 'Settings Saved', 'Your settings have been saved.');
  return libQ.resolve();
};

// Loading data from Config.json
SleepWakePlugin.prototype.loadConfig = function () {
  const self = this;

  self.sleepTime_Mon_Fri = self.config.get('Mon_Fri_sleepTime') || '22:00';
  self.sleepTime_Sat = self.config.get('Sat_sleepTime') || '22:00';
  self.sleepTime_Sun = self.config.get('Sun_sleepTime') || '22:00';
  self.wakeTime_Mon_Fri = self.config.get('Mon_Fri_wakeTime') || '07:00';
  self.wakeTime_Sat = self.config.get('Sat_wakeTime') || '07:00';
  self.wakeTime_Sun = self.config.get('Sun_wakeTime') || '07:00';
  self.startVolume = parseInt(self.config.get('startVolume'), 10) || 20;
  // Uvijek učitava `playlist` kao string
  const savedPlaylist = self.config.get('playlist');
  self.playlist = typeof savedPlaylist === 'string' ? savedPlaylist : String(savedPlaylist);
  self.writeLog('Loaded playlist: ' + self.playlist);
  
  self.volumeDecrease = parseInt(self.config.get('volumeDecrease'), 10) || 1;
  self.minutesFade = parseInt(self.config.get('minutesFade'), 10) || 10;
  self.volumeIncrease = parseInt(self.config.get('volumeIncrease'), 10) || 1;
  self.minutesRamp = parseInt(self.config.get('minutesRamp'), 10) || 10;

  self.writeLog('Configuration loaded:');
  self.writeLog('sleepTime_Mon_Fri: ' + self.sleepTime_Mon_Fri);
  self.writeLog('sleepTime_Sat: ' + self.sleepTime_Sat);
  self.writeLog('sleepTime_Sun: ' + self.sleepTime_Sun);
  self.writeLog('wakeTime_Mon_Fri: ' + self.wakeTime_Mon_Fri);
  self.writeLog('wakeTime_Sat: ' + self.wakeTime_Sat);
  self.writeLog('wakeTime_Sun: ' + self.wakeTime_Sun);
  self.writeLog('startVolume: ' + self.startVolume);
  self.writeLog('playlist: ' + self.playlist);
  self.writeLog('volumeDecrease: ' + self.volumeDecrease);
  self.writeLog('minutesFade: ' + self.minutesFade);
  self.writeLog('volumeIncrease: ' + self.volumeIncrease);
  self.writeLog('minutesRamp: ' + self.minutesRamp);
};

SleepWakePlugin.prototype.scheduleSleep = function () {
  const self = this;

  self.writeLog('Scheduling sleep function started...');
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  let sleepTimeStr;

  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
    sleepTimeStr = self.config.get('Mon_Fri_sleepTime') || '22:00';
  } else if (dayOfWeek === 6) { // Saturday
    sleepTimeStr = self.config.get('Sat_sleepTime') || '22:00';
  } else if (dayOfWeek === 0) { // Sunday
    sleepTimeStr = self.config.get('Sun_sleepTime') || '22:00';
  }

  let sleepTime = self.parseTime(sleepTimeStr);

  if (!sleepTime) {
    self.logger.error('SleepWakePlugin - Invalid sleep time. Sleep will not be scheduled.');
    self.writeLog('Invalid sleep time. Sleep will not be scheduled.');
    return;
  }

// check day and schedule new day if time is in the past  
  if (sleepTime <= now) {
    let nextDayForSleep = new Date();
    nextDayForSleep.setDate(nextDayForSleep.getDate() + 1);
    nextDayForSleep.setHours(sleepTime.getHours());
    nextDayForSleep.setMinutes(sleepTime.getMinutes());
    nextDayForSleep.setSeconds(0);
    nextDayForSleep.setMilliseconds(0);

    self.writeLog(`Adjusted sleep time to next day: ${nextDayForSleep}`);

    // update`sleepTime` new objekt
    sleepTime = nextDayForSleep;

    // Check day in week again
    const newDayOfWeek = nextDayForSleep.getDay();
    let newSleepTimeStr;

    if (newDayOfWeek >= 1 && newDayOfWeek <= 5) { // Monday to Friday
      newSleepTimeStr = self.config.get('Mon_Fri_sleepTime') || '22:00';
    } else if (newDayOfWeek === 6) { // Saturday
      newSleepTimeStr = self.config.get('Sat_sleepTime') || '22:00';
    } else if (newDayOfWeek === 0) { // Sunday
      newSleepTimeStr = self.config.get('Sun_sleepTime') || '22:00';
    }

    // If there is change, parse new time. 
    if (newSleepTimeStr !== sleepTimeStr) {
      const reParsedTime = self.parseTime(newSleepTimeStr);
      if (!reParsedTime) {
        self.logger.error('SleepWakePlugin - Invalid sleep time for next day. Sleep will not be scheduled.');
        self.writeLog('Invalid sleep time for next day. Sleep will not be scheduled.');
        return;
      }
      sleepTime = reParsedTime;
      sleepTime.setDate(nextDayForSleep.getDate());
      self.writeLog(`Re-adjusted sleep time after parsing for next day: ${sleepTime}`);
    }
  }


  // Calculate the time until sleep starts (in milliseconds)
  const timeUntilSleep = sleepTime - now;

  if (self.sleepTimer) {
    clearTimeout(self.sleepTimer);
    self.writeLog('Cleared existing sleep timer.func scheduleSleep()');
  }

  self.logger.info('SleepWakePlugin - Sleep scheduled in ' + timeUntilSleep + ' milliseconds');
  self.writeLog('Sleep scheduled in ' + timeUntilSleep + ' milliseconds');

  self.sleepTimer = setTimeout(function () {
    self.logger.info('SleepWakePlugin - Sleep timer triggered');
    self.writeLog('Sleep timer triggered.');
    self.fadeOutVolume();
  }, timeUntilSleep);
};

SleepWakePlugin.prototype.scheduleWake = function () {
  const self = this;

  self.writeLog('Scheduling wake function started...');

  const now = new Date();
  const dayOfWeek = now.getDay();
  let wakeTimeStr;

  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
    wakeTimeStr = self.config.get('Mon_Fri_wakeTime') || '07:00';
  } else if (dayOfWeek === 6) { // Saturday
    wakeTimeStr = self.config.get('Sat_wakeTime') || '07:00';
  } else if (dayOfWeek === 0) { // Sunday
    wakeTimeStr = self.config.get('Sun_wakeTime') || '07:00';
  }

  let wakeTime = self.parseTime(wakeTimeStr);

  if (!wakeTime) {
    self.logger.error('SleepWakePlugin - Invalid wake time. Wake will not be scheduled.');
    self.writeLog('Invalid wake time. Wake will not be scheduled.');
    return;
  }

 // Check if time is in past
  if (wakeTime <= now) {
    let nextDayForWake = new Date(); 
    nextDayForWake.setDate(nextDayForWake.getDate() + 1);
    nextDayForWake.setHours(wakeTime.getHours());
    nextDayForWake.setMinutes(wakeTime.getMinutes());
    nextDayForWake.setSeconds(0);
    nextDayForWake.setMilliseconds(0);

    self.writeLog(`Adjusted wake time to next day: ${nextDayForWake}`);

    wakeTime = nextDayForWake;

    const newDayOfWeek = nextDayForWake.getDay();
    let newWakeTimeStr;

    if (newDayOfWeek >= 1 && newDayOfWeek <= 5) { // Monday to Friday
      newWakeTimeStr = self.config.get('Mon_Fri_wakeTime') || '07:00';
    } else if (newDayOfWeek === 6) { // Saturday
      newWakeTimeStr = self.config.get('Sat_wakeTime') || '07:00';
    } else if (newDayOfWeek === 0) { // Sunday
      newWakeTimeStr = self.config.get('Sun_wakeTime') || '07:00';
    }

    if (newWakeTimeStr !== wakeTimeStr) {
      const reParsedTime = self.parseTime(newWakeTimeStr);
      if (!reParsedTime) {
        self.logger.error('SleepWakePlugin - Invalid wake time for next day. Wake will not be scheduled.');
        self.writeLog('Invalid wake time for next day. Wake will not be scheduled.');
        return;
      }
      wakeTime = reParsedTime;
      wakeTime.setDate(nextDayForWake.getDate());
      self.writeLog(`Re-adjusted wake time after parsing for next day: ${wakeTime}`);
    }
  }

  // Calculate the time until wake starts (in milliseconds)
  const timeUntilWake = wakeTime - now;

  if (self.wakeTimer) {
    clearTimeout(self.wakeTimer);
    self.writeLog('Cleared existing wake timer.- func scheduleWake()');
  }

  self.logger.info('SleepWakePlugin - Wake scheduled in ' + timeUntilWake + ' milliseconds');
  self.writeLog('Wake scheduled in ' + timeUntilWake + ' milliseconds');

  self.wakeTimer = setTimeout(function () {
    self.logger.info('SleepWakePlugin - Wake timer triggered');
    self.writeLog('Wake timer triggered.');
    self.startPlaylist();
  }, timeUntilWake);
};

SleepWakePlugin.prototype.parseTime = function (timeStr) {
 
  const self = this;
  self.writeLog('Parsing time from string: ' + timeStr);
  let parsedTime;

  // Try parsing the time string
  if (timeStr.includes('T')) {
    // Handle ISO date string
    parsedTime = new Date(timeStr);
  } else if (timeStr.includes(':')) {
    // Handle "HH:MM" format
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    parsedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  } else {
    self.writeLog('Unrecognized time format: ' + timeStr);
    return null;
  }

  if (isNaN(parsedTime.getTime())) {
    self.writeLog('Failed to parse time from string: ' + timeStr);
    return null;
  }

  // Adjust for time zone if necessary
  if (timeStr.includes('Z')) {
    // If the time string is in UTC (contains 'Z'), adjust to local time
    parsedTime = new Date(parsedTime.getTime() + parsedTime.getTimezoneOffset() * 60000);
  }

  self.writeLog('Parsed time: ' + parsedTime);
  return parsedTime;
};

SleepWakePlugin.prototype.sendRestCommand = function (endpoint, callback) {
  
  const self = this;
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: endpoint,
    method: 'GET',
  };

  self.logger.info(`Sending REST command to ${options.hostname}:${options.port}${options.path}`);
  self.writeLog(`Sending REST command to ${options.hostname}:${options.port}${options.path}`);

  const req = http.request(options, (res) => {
    res.setEncoding('utf8');
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    res.on('end', () => {
      self.logger.info(`Received response: ${responseData}`);
      self.writeLog(`Received response: ${responseData}`);
      if (callback) {
        callback(null, responseData);
      }
    });
  });

  req.on('error', (e) => {
    self.logger.error(`Problem with request: ${e.message}`);
    self.writeLog(`Problem with request: ${e.message}`);
    if (callback) {
      callback(e);
    }
  });

  req.end();
};

SleepWakePlugin.prototype.getCurrentVolume = function (callback) {

  const self = this;
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/getState',
    method: 'GET',
  };

  self.logger.info('Getting current volume');
  self.writeLog('Getting current volume');

  const req = http.request(options, (res) => {
    res.setEncoding('utf8');
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    res.on('end', () => {
      try {
        const data = JSON.parse(responseData);
        const currentVolume = parseInt(data.volume, 10);
        self.logger.info(`Current volume is ${currentVolume}`);
        self.writeLog(`Current volume is ${currentVolume}`);
        callback(null, currentVolume);
      } catch (error) {
        self.logger.error('Error parsing volume: ' + error);
        self.writeLog('Error parsing volume: ' + error);
        callback(error);
      }
    });
  });

  req.on('error', (e) => {
    self.logger.error(`Problem with request: ${e.message}`);
    self.writeLog(`Problem with request: ${e.message}`);
    callback(e);
  });

  req.end();
};

SleepWakePlugin.prototype.fadeOutVolume = function () {

  const self = this;

  // If already waking up, do not proceed with sleep
  if (self.isWaking) {
    self.logger.warn('SleepWakePlugin - Cannot start sleep during wake-up process.');
    self.writeLog('Cannot start sleep during wake-up process.');
    return;
  }

  self.isSleeping = true;

  self.logger.info('SleepWakePlugin - Starting fade out volume');
  self.writeLog('Starting fade out volume');

 
  const stepsSleep = Math.ceil(self.volumeDecrease); 
  const intervalSleep = (self.minutesFade * 60 * 1000) / stepsSleep; //set it in miliseconds
  self.writeLog(`Number of sleeping volume steps calculated: ${stepsSleep}`);
  let step = 1;
  
  // Start the volume decrease process one more time
  decreaseVolume();
  

  function decreaseVolume() {    
    try {
          // **Check if `isSleeping` brake**
      if (!self.isSleeping) {
        self.logger.info('SleepWakePlugin - Fade out process interrupted.');
        self.writeLog('Fade out process interrupted.');
        return; // stop the proces if it is brake
      }
      
      if (step > stepsSleep) {
        self.logger.info('SleepWakePlugin - Fade out complete. Stopping playback.');
        self.writeLog('Fade out complete. Stopping playback.');

        // Stop playback
        self.sendRestCommand('/api/v1/commands/?cmd=stop', function (err, response) {
          if (err) {
            self.logger.error('Error stopping playback: ' + err);
            self.writeLog('Error stopping playback: ' + err);
          } else {
            self.logger.info('Playback stopped.');
            self.writeLog('Playback stopped.');
          }
        });
        self.isSleeping = false;
        // Go to  onStart() sleep finished
        self.onStart();
        return;
      }

      self.getCurrentVolume(function (err, currentVolume) {
        if (err) {
          self.logger.error('Error getting current volume: ' + err);
          self.writeLog('Error getting current volume: ' + err);
          return;
        }

        const newVolume = Math.max(currentVolume - 1, 0); // Ensure volume doesn't go below 0

        self.logger.info(`Decreasing volume by 1: setting volume to ${newVolume}`);
        self.writeLog(`Decreasing volume by 1: setting volume to ${newVolume}`);

        // Set the new volume
        self.sendRestCommand(`/api/v1/commands/?cmd=volume&volume=${newVolume}`, function (err, response) {
          if (err) {
            self.logger.error('Error setting volume: ' + err);
            self.writeLog('Error setting volume: ' + err);
          } else {
            self.logger.info(`Volume set to ${newVolume}`);
            self.writeLog(`Volume set to ${newVolume}`);
          }

          step++;
          setTimeout(decreaseVolume, intervalSleep);
        });
      });
    } catch (error) {
      self.logger.error('SleepWakePlugin - Error in decreaseVolume: ' + error);
      self.writeLog('Error in decreaseVolume: ' + error);
      self.isSleeping = false;
    }
  }

};

SleepWakePlugin.prototype.startPlaylist = function () {
 
  const self = this;

  // If already sleeping, interrupt sleep
  if (self.isSleeping) {
    self.logger.info('SleepWakePlugin - Interrupting sleep to start wake-up.');
    self.writeLog('Interrupting sleep to start wake-up.');

    // Clear sleep timers
    if (self.sleepTimer) {
      clearTimeout(self.sleepTimer);
      self.writeLog('Cleared sleep timer.');
    }
    self.isSleeping = false;
  }

  self.isWaking = true;

  self.logger.info('SleepWakePlugin - Starting playlist');
  self.writeLog('Starting playlist');
  
  
  const steps = Math.ceil(self.volumeIncrease); // counting steps
  const interval = (self.minutesRamp * 60 * 1000) / steps; //calculates to miliseconds
  self.writeLog(`Number of waking volume steps calculated: ${steps}`);

  let stepWake = 1;
  
  // Set initial volume
  self.sendRestCommand(`/api/v1/commands/?cmd=volume&volume=${self.startVolume}`, function (err, response) {
    if (err) {
      self.logger.error('Error setting initial volume: ' + err);
      self.writeLog('Error setting initial volume: ' + err);
    } else {
      self.logger.info(`Initial volume set to ${self.startVolume}`);
      self.writeLog(`Initial volume set to ${self.startVolume}`);

      // Start the playlist after setting the volume
      self.sendRestCommand(`/api/v1/commands/?cmd=playplaylist&name=${encodeURIComponent(self.playlist)}`, function (err, response) {
        if (err) {
          self.logger.error('Error starting playlist: ' + err);
          self.writeLog('Error starting playlist: ' + err);
        } else {
          self.logger.info(`Playlist "${self.playlist}" started.`);
          self.writeLog(`Playlist "${self.playlist}" started.`);

          // Start increasing volume
          increaseVolume();
        }
      });
    }
  });

  function increaseVolume() {
    try {
      if (stepWake > steps) {
        self.logger.info('SleepWakePlugin - Volume increase complete.');
        self.writeLog('Volume increase complete.');
        self.isWaking = false;
        // Go to onStart() waking finished
        self.onStart();
        return;
      }
      
      self.getCurrentVolume(function (err, currentVolume) {
        if (err) {
          self.logger.error('Error getting current volume: ' + err);
          self.writeLog('Error getting current volume: ' + err);
          return;
        }

        const newVolume = Math.min(currentVolume + 1, 100); // Ensure volume doesn't exceed 100

        self.logger.info(`Increasing volume by 1: setting volume to ${newVolume}`);
        self.writeLog(`Increasing volume by 1: setting volume to ${newVolume}`);

        // Set the new volume
        self.sendRestCommand(`/api/v1/commands/?cmd=volume&volume=${newVolume}`, function (err, response) {
          if (err) {
            self.logger.error('Error setting volume: ' + err);
            self.writeLog('Error setting volume: ' + err);
          } else {
            self.logger.info(`Volume set to ${newVolume}`);
            self.writeLog(`Volume set to ${newVolume}`);
          }

          stepWake++;
          setTimeout(increaseVolume, interval);
        });
      });
    } catch (error) {
      self.logger.error('SleepWakePlugin - Error in increaseVolume: ' + error);
      self.writeLog('Error in increaseVolume: ' + error);
      self.isWaking = false;
    }
  }

};

SleepWakePlugin.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

SleepWakePlugin.prototype.getConf = function (varName) {
  const self = this;
  return self.config.get(varName);
};

SleepWakePlugin.prototype.setConf = function (varName, varValue) {
  const self = this;
  self.config.set(varName, varValue);
};

// Custom method to write logs to a file
SleepWakePlugin.prototype.writeLog = function (message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${os.EOL}`;
  fs.appendFileSync(this.logFile, logMessage, { encoding: 'utf8' });
};


// check log file and delete if large
SleepWakePlugin.prototype.manageLogSize = function () {
  const self = this;

  try {
    // Check if file exist
    if (fs.existsSync(self.logFile)) {
      // get file data
      const stats = fs.statSync(self.logFile);

      // check size of file
      if (stats.size > MAX_LOG_SIZE) {
        // delete file if larger then 2mb
        fs.unlinkSync(self.logFile);
        
        // start new log
        self.writeLog('Log file exceeded 2 MB. Old log file deleted, new log started.');
      }
    }
  } catch (error) {
    self.logger.error('Error managing log file size: ' + error);
    self.writeLog('Error managing log file size: ' + error);
  }
};

// Get existing playlists from volumio API
SleepWakePlugin.prototype.fetchPlaylists = function () {
  const self = this;
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/browse?uri=playlists',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const playlists = response.navigation.lists[0].items.map((item) => ({
            value: item.title,
            label: item.title,
          }));
          resolve(playlists);
        } catch (error) {
          self.writeLog('Error parsing playlist data: ' + error);
          reject(error);
        }
      });
    });

    req.on('error', (e) => {
      self.writeLog('Error fetching playlists: ' + e.message);
      reject(e);
    });

    req.end();
  });
};


