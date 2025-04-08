'use strict';

var libQ = require('kew');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var cron = require('node-cron');

module.exports = ScheduledRestart;

function ScheduledRestart(context) {
    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
    this.scheduledJobs = [];
}

ScheduledRestart.prototype.onVolumioStart = function() {
    var self = this;
    var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
};

ScheduledRestart.prototype.onStart = function() {
    var self = this;
    var defer = libQ.defer();

    // Schedule the reboot based on saved configuration
    self.scheduleReboots();

    defer.resolve();

    return defer.promise;
};

ScheduledRestart.prototype.onStop = function() {
    var self = this;
    var defer = libQ.defer();

    // Clear all scheduled jobs
    self.clearScheduledReboots();

    defer.resolve();

    return libQ.resolve();
};

ScheduledRestart.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};

// Schedule reboot tasks based on configuration
ScheduledRestart.prototype.scheduleReboots = function() {
    var self = this;
    self.clearScheduledReboots();

    var daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var hours = self.config.get('hours');
    var minutes = self.config.get('minutes');

    var timezone = self.getSystemTimezone();

    // Validate hours and minutes
    if (!self.isValidTime(hours, minutes)) {
        return; // Exit early if time is invalid
    }

    self.logger.info(`Scheduling reboots with hours: ${hours}, minutes: ${minutes} in timezone: ${timezone}`);

    // Create cron jobs for each selected day
    daysOfWeek.forEach(function(day, index) {
        if (self.config.get(day)) {
            var cronTime = `0 ${minutes} ${hours} * * ${index}`;
            self.scheduleCronJob(cronTime, timezone);
        }
    });
};

// Get system timezone or fallback to UTC if not found
ScheduledRestart.prototype.getSystemTimezone = function() {
    var timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) {
        this.logger.info("Timezone not found. Falling back to UTC.");
        timezone = "UTC";
    }
    return timezone;
};

// Validate time values (hours and minutes)
ScheduledRestart.prototype.isValidTime = function(hours, minutes) {
    if (!/^\d+$/.test(hours) || !/^\d+$/.test(minutes)) {
        this.logger.error("Invalid hours or minutes value");
        return false;
    }

    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        this.logger.error("Hours or minutes out of range");
        return false;
    }
    return true;
};

// Schedule a cron job based on cronTime and timezone
ScheduledRestart.prototype.scheduleCronJob = function(cronTime, timezone) {
    var self = this;
    self.logger.info(`Scheduling job with cron expression: ${cronTime}`);

    var job = cron.schedule(cronTime, function() {
        self.logger.info('Rebooting system as per schedule...');
        exec('sudo reboot', (error, stdout, stderr) => {
            if (error) {
                self.logger.error(`Error executing reboot: ${error}`);
            }
        });
    }, {
        scheduled: true,
        timezone: timezone
    });

    self.scheduledJobs.push(job);
};

ScheduledRestart.prototype.clearScheduledReboots = function() {
    var self = this;
    self.scheduledJobs.forEach(function(job) {
        job.stop();
    });
    self.scheduledJobs = [];
};

// Configuration Methods -----------------------------------------------------------------------------
ScheduledRestart.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf) {
            // Retrieve stored values
            const hours = self.config.get('hours');
            const minutes = self.config.get('minutes');

            // Transform stored values into the expected format
            uiconf.sections[0].content[0].value = {
                value: hours,
                label: hours.toString().padStart(2, '0')
            };

            uiconf.sections[0].content[1].value = {
                value: minutes,
                label: minutes.toString().padStart(2, '0')
            };

            // Set boolean values directly for days
            uiconf.sections[0].content[2].value = self.config.get('monday');
            uiconf.sections[0].content[3].value = self.config.get('tuesday');
            uiconf.sections[0].content[4].value = self.config.get('wednesday');
            uiconf.sections[0].content[5].value = self.config.get('thursday');
            uiconf.sections[0].content[6].value = self.config.get('friday');
            uiconf.sections[0].content[7].value = self.config.get('saturday');
            uiconf.sections[0].content[8].value = self.config.get('sunday');

            defer.resolve(uiconf);
        })
        .fail(function(error) {
            self.logger.error('Failed to parse UI Configuration page for plugin: ' + error);
            defer.reject(new Error());
        });

    return defer.promise;
};

ScheduledRestart.prototype.saveSchedule = function(data) {
    var self = this;
    var defer = libQ.defer();

    self.logger.info("Saving schedule with data: " + JSON.stringify(data));

    // Extract and save only the 'value' for 'hours' and 'minutes'
    var hours = data.hours && typeof data.hours === 'object' ? data.hours.value : data.hours;
    var minutes = data.minutes && typeof data.minutes === 'object' ? data.minutes.value : data.minutes;

    self.logger.debug(`Extracted hours: ${hours}, minutes: ${minutes}`);

    // Validate time before saving
    if (self.isValidTime(hours, minutes)) {
        self.config.set('hours', hours);
        self.config.set('minutes', minutes);

        // Save day selections
        self.config.set('monday', data.monday);
        self.config.set('tuesday', data.tuesday);
        self.config.set('wednesday', data.wednesday);
        self.config.set('thursday', data.thursday);
        self.config.set('friday', data.friday);
        self.config.set('saturday', data.saturday);
        self.config.set('sunday', data.sunday);

        // Reschedule reboots with updated configuration
        self.scheduleReboots();

        self.logger.info("Schedule saved successfully. Reboot schedule updated.");
        self.commandRouter.pushToastMessage('success', "Schedule Saved", "Reboot schedule saved successfully.");
        defer.resolve({});
    } else {
        self.logger.error("Invalid time format. Schedule not saved.");
        self.commandRouter.pushToastMessage('error', "Invalid Time", "Please enter a valid time.");
        defer.reject(new Error("Invalid time format."));
    }

    return defer.promise;
};

ScheduledRestart.prototype.getConfigurationFiles = function() {
    return ['config.json'];
}

ScheduledRestart.prototype.setUIConfig = function(data) {
    var self = this;
    // Perform your configuration tasks here
};

ScheduledRestart.prototype.getConf = function(varName) {
    var self = this;
    // Perform your configuration tasks here
};

ScheduledRestart.prototype.setConf = function(varName, varValue) {
    var self = this;
    // Perform your configuration tasks here
};

