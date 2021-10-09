const childProcess = require('child_process');
const EventEmitter = require('events');
const util = require('util');
const JSONStream = require('./json-stream.js');

function Journalctl (opts) {
	EventEmitter.call(this);

	// Decode opts
	const args = ['-f', '-o', 'json'];
	if (opts === undefined) opts = {};
	if (opts.all) args.push('-a');
	if (opts.lines) args.push('-n', opts.lines);
	if (opts.since) args.push('-S', opts.since);
	if (opts.identifier) args.push('-t', opts.identifier);
	if (opts.unit) args.push('-u', opts.unit);
	if (opts.filter) {
		if (!(opts.filter instanceof Array)) opts.filter = [opts.filter];
		opts.filter.forEach((f) => args.push(f));
	}

	// Start journalctl
	this.journalctl = childProcess.spawn('journalctl', args);

	// Setup decoder
	const decoder = new JSONStream((e) => {
		this.emit('event', e);
	});
	this.journalctl.stdout.on('data', (chunk) => {
		decoder.decode(chunk.toString());
	});
}

util.inherits(Journalctl, EventEmitter);

Journalctl.prototype.stop = function (cb) {
	// Kill the process
	if (cb) this.journalctl.on('exit', cb);
	this.journalctl.kill();
};

module.exports = Journalctl;
