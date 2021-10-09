function JSONStream (cb) {
	this.cb = cb;
	this.obj = 0;
	this.str = false;
	this.esc = false;
}

JSONStream.prototype.decode = function (str) {
	for (let i = 0; i < str.length; i++) this.decodeChar(str[i]);
};

JSONStream.prototype.decodeChar = function (c) {
	// Start catching new object
	if (!this.str && c === '{' && this.obj++ === 0) {
		this.data = '';
	}

	// Add character
	this.data += c;

	// Hide brackets in strings
	if (c === '"' && !this.esc) this.str = !this.str;

	// Track escape chars
	if (!this.esc && c === '\\') {
		this.esc = true;
	} else if (this.esc) {
		this.esc = false;
	}

	// Stop at closing bracket
	if (!this.str && c === '}' && --this.obj === 0) {
		this.cb(JSON.parse(this.data));
	}
};

module.exports = JSONStream;
