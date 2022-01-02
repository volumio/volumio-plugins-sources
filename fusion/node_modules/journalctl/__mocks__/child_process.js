const EventEmitter = require('events');

module.exports.spawn = jest.fn(() => {
	module.exports.__spawn = new EventEmitter();
	module.exports.__spawn.stdout = new EventEmitter();
	module.exports.__spawn.kill = jest.fn();
	return module.exports.__spawn;
});
