const {Gpio} = require("/volumio/node_modules/onoff");
const {getGpioMapping, GpioPermissionError} = require("./gpiomap");
const spi = (()=>{
	// compat with nodejs v20, v22
	const abi = process.versions.modules;
	let module;
	try{
		module = require(`./bin/${abi}/spi.node`)
	}
	catch(err){
		console.error("No supported binaries for module spi-device for the current nodejs installation ABI.");
		process.exit(77);
	}
	return module;
})();
const cp = require("child_process");
const fs = require("fs");

const ENABLE_GRAYSCALE_TABLE = Buffer.alloc(1, 0x00);
const SET_COLUMN_ADDR = Buffer.alloc(1, 0x15);
const ENABLE_RAM_WRITE = Buffer.alloc(1, 0x5C);
const SET_ROW_ADDR = Buffer.alloc(1, 0x75);
const SET_REMAP_AND_DUAL_COM = Buffer.alloc(1, 0xA0);
const SET_DISP_START_LINE = Buffer.alloc(1, 0xA1);
const SET_DISP_OFFSET = Buffer.alloc(1, 0xA2);

const SET_DISP_MODE_OFF = Buffer.alloc(1, 0xA4);
const SET_DISP_MODE_ON = Buffer.alloc(1, 0xA5);
const SET_DISP_MODE_NORMAL = Buffer.alloc(1, 0xA6);
const SET_DISP_MODE_INVERTED = Buffer.alloc(1, 0xA7);

const ENABLE_PARTIAL_MODE = Buffer.alloc(1, 0xA8);
const DISABLE_PARTIAL_MODE = Buffer.alloc(1, 0xA9);

const SLEEP_MODE_ON = Buffer.alloc(1, 0xAE);
const SLEEP_MODE_OFF = Buffer.alloc(1, 0xAF);

const SET_PHASE_LENGTH = Buffer.alloc(1, 0xB1);
const SET_FRONT_CLOCK_DIV = Buffer.alloc(1, 0xB3);
const DISP_ENCHANCEMENT = Buffer.alloc(1, 0xB4);
const SET_2ND_PRECHARGE_PERIOD = Buffer.alloc(1, 0xB6);
const SET_GRAYSCALE_TABLE = Buffer.alloc(1, 0xB8);
const SET_DEFAULT_GRAYSCALE_TAB = Buffer.alloc(1, 0xB9);
const SET_PRECHARGE_VOLTAGE = Buffer.alloc(1, 0xBB);
const SET_V_COMH = Buffer.alloc(1, 0xBE);
const SET_CONTRAST_CURRENT = Buffer.alloc(1, 0xC1);
const MASTER_CONTRAST_CURRENT = Buffer.alloc(1, 0xC7);
const SET_MUX_RATIO = Buffer.alloc(1, 0xCA);
const SET_COMMANDS_LOCK = Buffer.alloc(1, 0xFD);
const SET_DISPENHB = Buffer.alloc(1, 0xD1);
const SET_VDDSEL = Buffer.alloc(1, 0xAB);
const SET_GPIO = Buffer.alloc(1, 0xB5);

const ACTIVATE_SCROLL = Buffer.alloc(1, 0x2F);
const DEACTIVATE_SCROLL = Buffer.alloc(1, 0x2E);
const SET_VERTICAL_SCROLL_AREA = Buffer.alloc(1, 0xA3);
const RIGHT_HORIZONTAL_SCROLL = Buffer.alloc(1, 0x26);
const LEFT_HORIZONTAL_SCROLL = Buffer.alloc(1, 0x27);
const VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL = Buffer.alloc(1, 0x29);
const VERTICAL_AND_LEFT_HORIZONTAL_SCROLL = Buffer.alloc(1, 0x2A);



// cette fonction est écrasée @init() si le bufsiz système est ingérieur à au buffer d'écran
Oled.prototype.chunkSpiMessage = function() {
	return [this.buffer];
}

Oled.prototype.setBufferChunkingStrategy = async function() {
	let max_bufsiz = await fs.promises.readFile("/sys/module/spidev/parameters/bufsiz");
	max_bufsiz = parseInt(max_bufsiz);

	if (this.bufferlength > max_bufsiz) {
		const _chunks_nb = Math.ceil(this.bufferlength / max_bufsiz);

		this.chunkSpiMessage = function() {
			const chunks = [];
			let i = 0;
			while (i < _chunks_nb) {
				chunks.push(
					this.buffer.subarray(
						i * max_bufsiz,
						(i + 1) * max_bufsiz));
				i++;
			}
			return chunks;
		}
	}
}

function sleepMs(n) {
	return new Promise((resolve, reject) => {
		setTimeout(x => resolve(), n);
	})
}

function chunkString(str, length) {
	return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

function Oled(width, height, dcPin, rstPin, contrast) {

	this.WIDTH = width ?? 256;
	this.HEIGHT = height ?? 64;
	this.contrast = contrast ?? 0x00;
	
	this.pins = {
		DC: (dcPin ?? 27),
		RST: (rstPin ?? 24),
	}

	this.horizontal_chunks = this.WIDTH >> 2;

	const regstartH = 28;
	const regstartV = 0;

	this._rXs = Buffer.alloc(1, regstartH); // Registre du ctrleur correspondant à la première col de l'écran
	this._rXe = Buffer.alloc(1, regstartH + this.horizontal_chunks - 1); // Registre du ctrleur correspondant à la dernière col de l'écran

	this._rYs = Buffer.alloc(1, regstartV); // Registre du ctrleur correspondant à la première ligne de l'écran
	this._rYe = Buffer.alloc(1, regstartV + this.HEIGHT - 1); // Registre du ctrleur correspondant à la dernière ligne de l'écran

	this.cursor_x = 0;
	this.cursor_y = 0;

	// Buffer écran
	this.buffer = Buffer.alloc(2 * this.horizontal_chunks * this.HEIGHT).fill(0x00);
	this.bufferlength = this.buffer.length;

	this.updateInProgress = false;
	this.hex_font = null;

}

Oled.prototype.begin = async function() {

	let gpio_map;
	try{
		 gpio_map = (await getGpioMapping()).gpio;
	}
	catch(err){
		if (err instanceof GpioPermissionError) {
			console.warn("Cannot get GPIO offset, EVO Oled#2 display needs this ressource to be accessible.")
			process.exit(77);
		}
	}
	
	if( 
		gpio_map[this.pins.DC]?.offset === undefined 
		|| gpio_map[this.pins.RST]?.offset === undefined 
	){
			console.warn("No valid GPIO found, EVO Oled#2 display needs this ressource to run.")
			process.exit(77);
	}
	
	
	await this.setBufferChunkingStrategy();

	this.dcPin = new Gpio( ( gpio_map[this.pins.DC].offset ).toString() , 'out');
	this.rsPin = new Gpio( ( gpio_map[this.pins.RST].offset ).toString() , 'out');
	
	this.spiDev = spi.openSync(0, 0, {
		mode: spi.MODE0,
		speedHz: 4800000
	});

	await this.init();
	await this.clear();
}

Oled.prototype.init = async function() {

	await this.reset();

	this.cmd(SET_COMMANDS_LOCK); //set Command unlock
	this.data(Buffer.alloc(1, 0x12));
	this.cmd(SLEEP_MODE_ON); //set display off
	this.cmd(SET_FRONT_CLOCK_DIV); //set display clock divide ratio
	this.data(Buffer.alloc(1, 0x91));
	this.cmd(SET_MUX_RATIO); //set multiplex ratio
	this.data(Buffer.alloc(1, 0x3F));
	this.cmd(SET_DISP_OFFSET); //set display offset to 0
	this.data(Buffer.alloc(1, 0x00));
	this.cmd(SET_DISP_START_LINE); //start display start line to 0
	this.data(Buffer.alloc(1, 0x00));
	this.cmd(SET_REMAP_AND_DUAL_COM); //set remap and dual COM Line Mode
	this.data(Buffer.alloc(1, 0x14));
	this.data(Buffer.alloc(1, 0x11));
	this.cmd(SET_GPIO); //disable IO input
	this.data(Buffer.alloc(1, 0x00));
	this.cmd(SET_VDDSEL); //function select
	this.data(Buffer.alloc(1, 0x01));
	this.cmd(DISP_ENCHANCEMENT); //enable VSL extern
	this.data(Buffer.alloc(1, 0xA0));
	this.data(Buffer.alloc(1, 0xFD));
	this.cmd(SET_CONTRAST_CURRENT); //set contrast current
	this.data(Buffer.alloc(1, 0xFF));
	this.cmd(MASTER_CONTRAST_CURRENT); //set master contrast current
	this.data(Buffer.alloc(1, this.contrast));
	this.cmd(SET_DEFAULT_GRAYSCALE_TAB); //default grayscale
	this.cmd(SET_PHASE_LENGTH); //set phase length
	this.data(Buffer.alloc(1, 0xE2));
	this.cmd(SET_DISPENHB); //enhance driving scheme capability
	this.data(Buffer.alloc(1, 0x82));
	this.data(Buffer.alloc(1, 0x20));
	this.cmd(SET_PRECHARGE_VOLTAGE); //first pre charge voltage
	this.data(Buffer.alloc(1, 0x1F));
	this.cmd(SET_2ND_PRECHARGE_PERIOD); //second pre charge voltage
	this.data(Buffer.alloc(1, 0x08));
	this.cmd(SET_V_COMH); //VCOMH
	this.data(Buffer.alloc(1, 0x07));
	this.cmd(SET_DISP_MODE_NORMAL); //set normal display mode
	this.cmd(DISABLE_PARTIAL_MODE); //no partial mode

	await sleepMs(10);

	this.cmd(SLEEP_MODE_OFF); //display on
	await sleepMs(10);
}

Oled.prototype.write = function(buff) {

	if (typeof buff !== "object") {
		console.trace();
		process.exit()
	}

	const message = [{
		sendBuffer: buff,
		byteLength: buff.length,
		speedHz: 4800000
	}];

	this.spiDev.transferSync(message);

}

Oled.prototype.cmd = async function(command) {
	this.dcPin.writeSync(0);
	await this.write(command);
}

Oled.prototype.data = async function(data) {
	this.dcPin.writeSync(1);
	await this.write(data);
}

Oled.prototype.reset = async function() {
	this.rsPin.writeSync(0);
	await sleepMs(1);
	this.rsPin.writeSync(1);
	await sleepMs(50);
}

Oled.prototype._update = async function() {

	if (this.updateInProgress) {
		console.warn("Write collision");
		return;
	}

	this.updateInProgress = true;

	const spi_frames = this.chunkSpiMessage();

	await this.cmd(SET_COLUMN_ADDR);
	await this.data(this._rXs);
	await this.data(this._rXe);
	await this.cmd(SET_ROW_ADDR);
	await this.data(this._rYs);
	await this.data(this._rYe);
	await this.cmd(ENABLE_RAM_WRITE);

	for (spi_frame of spi_frames) {
		await this.data(spi_frame)
	}

	this.updateInProgress = false;
}

// wrapper to avoid collision when writing pixel buffers
Oled.prototype.update = async function() {
	if (this._update_job)
		await this._update_job;
	this._update_job = this._update();
	return this._update_job;
}

Oled.prototype.clear = async function() {
	this.buffer.fill(0x00);
	await this.update();
}

// set starting position of a text string on the oled
Oled.prototype.setCursor = function(x, y) {
	this.cursor_x = x;
	this.cursor_y = y;
}

// write text to the oled
Oled.prototype.writeString = function(font, size, string, color) {
	var wordArr = string.split(' '),
		len = wordArr.length,
		offset = this.cursor_x,
		padding = 0,
		letspace = 0,
		leading = 2;
	for (var w = 0; w < len; w += 1) {
		wordArr[w] += ' ';
		var stringArr = wordArr[w].split(''),
			slen = stringArr.length,
			compare = (font.width * size * slen) + (size * (len - 1));
		for (var i = 0; i < slen; i += 1) {
			var charBuf = this._findCharBuf(font, stringArr[i]);
			var charBytes = this._readCharBytes(charBuf);
			this._drawChar(charBytes, size, color);
			padding = size + letspace;
			offset += (font.width * size) + padding;
			this.setCursor(offset, this.cursor_y);
		}
	}
}

// draw an individual character to the screen
Oled.prototype._drawChar = function(byteArray, size, col) {
	var x = this.cursor_x,
		y = this.cursor_y;
	for (var i = 0; i < byteArray.length; i += 1) {
		for (var j = 0; j < 8; j += 1) {
			var color = byteArray[i][j] * col,
				xpos,
				ypos;
			if (size === 1) {
				xpos = x + i;
				ypos = y + j;
				this.drawPixel(xpos, ypos, color);
			} else {
				xpos = x + (i * size);
				ypos = y + (j * size);
				this.fillRect(xpos, ypos, size, size, color, false);
			}
		}
	}
}

// BASIC UNICODE SUPPORT
Oled.prototype.load_hex_font = async function(fontpath) {
	this.hex_font = {};
	const data = await fs.promises.readFile("unifont.hex");
	let unichars = data.toString().split("\n");
	for (let unichar of unichars) {
		let code = parseInt(unichar.substring(0, 4), 16);
		let value = unichar.substring(5);
		if (code) {
			let splitval;
			let columns = 0;
			let row_length = 0;
			if (value.length === 64) {
				columns = 4;
				row_length = 16;
			} else {
				columns = 2;
				row_length = 8;
			}
			splitval = chunkString(value, columns);
			for (let i in splitval) {
				splitval[i] = parseInt(splitval[i], 16)
			}
			this.hex_font[code] = {
				data: splitval,
				length: row_length
			}
		};
	}

}

Oled.prototype.CacheGlyphsData = function(string) {
	this.cached_glyph = {};
	if (!this.hex_font) {
		console.log("font not loaded");
		return
	}
	let used_chars = new Set(string);
	for (used_char of used_chars) {
		let height = 0,
			binary_glyph = [],
			binary_row_string = "",
			glyph_raw_data = this.hex_font[used_char.charCodeAt()];

		if (glyph_raw_data) {
			let data = glyph_raw_data.data,
				length = glyph_raw_data.length;
			for (var i = 0; i < data.length; i += 1) {
				height++;
				binary_row_string = data[i].toString(2);
				while (binary_row_string.length < length) {
					binary_row_string = "0" + binary_row_string;
				}
				binary_glyph.push(binary_row_string);
			}
		}

		this.cached_glyph[used_char] = {
			data: binary_glyph,
			width: binary_row_string.length,
			height: height
		};
	}
}

Oled.prototype.writeStringUnifont = function(string, color) {

	let temp_cursor = this.cursor_x;
	// loop through the array of each char to draw
	for (var i = 0; i < string.length; i += 1) {
		if (!this.hex_font) {
			console.log("font not loaded");
			return
		}
		if (this.cursor_x >= this.WIDTH) {
			return
		}

		var charBuf = this.cached_glyph[string[i]];
		if (!charBuf || this.cursor_x + charBuf.width <= 0) {
			let spacing = (charBuf && charBuf.width) ? charBuf.width : 8;
			this.setCursor(this.cursor_x + spacing, this.cursor_y);
			continue;
		}
		// dessiner le glyphe à l'endroit du curseur
		this._drawCharUnifont(charBuf, color);
		// déplacer le curseur pour le prochain glyphe
		this.setCursor(this.cursor_x + charBuf.width, this.cursor_y);
	}
	//this.cursor_x = temp_cursor;
}

Oled.prototype.getStringWidthUnifont = function(string) {

	if (!string || !string.length)
		return 0;
	let width = 0;
	// loop through the array of each char to draw
	for (var i = 0; i < string.length; i += 1) {
		if (!this.hex_font) {
			console.log("font not loaded");
			return
		}
		var charBuf = this.hex_font[string[i].charCodeAt()];
		if (!charBuf)
			continue;
		width += charBuf.length;
	}

	return width;
}

// draw an individual character to the screen
Oled.prototype._drawCharUnifont = function(buf, color) {
	var y = this.cursor_x, // inversé parce que buf data est encodé en ligne plutôt qu'en colonnes.
		x = this.cursor_y,
		d = buf.data
	// pour chaque ligne
	for (var i = 0; i < buf.height; i += 1) {
		for (var j = 0; j < buf.width; j += 1) {
			this.drawPixel(y + j, x + i, d[i][j] * color);
		}
	}
}

Oled.prototype._readCharBytes = function(byteArray) {
	var bitArr = [],
		bitCharArr = [];
	for (var i = 0; i < byteArray.length; i += 1) {
		var byte = byteArray[i];
		for (var j = 0; j < 8; j += 1) {
			var bit = byte >> j & 1;
			bitArr.push(bit);
		}
		bitCharArr.push(bitArr);
		bitArr = [];
	}
	return bitCharArr;
}

// find where the character exists within the font object
Oled.prototype._findCharBuf = function(font, c) {
	var cBufPos = font.lookup.indexOf(c) * font.width;
	var cBuf = font.fontData.slice(cBufPos, cBufPos + font.width);
	return cBuf;
}

// turn oled off
Oled.prototype.turnOffDisplay = async function() {
	await this.clear();
	await this.cmd(SLEEP_MODE_ON);
}

// turn oled on
Oled.prototype.turnOnDisplay = async function() {
	await this.cmd(SLEEP_MODE_OFF);
}

Oled.prototype.setContrast = async function(contrast) {
	if (!contrast || contrast < 0 || contrast > 255)
		return;
	
	await this.cmd(MASTER_CONTRAST_CURRENT);
	await this.data(Buffer.alloc(1, contrast));
}

Oled.prototype.drawPixel = function(x, y, color, bypass_buffer) {

	// Ne rien faire si le pixel n'est pas dans l'espace de l'écran
	if (
		x >= this.WIDTH ||
		y >= this.HEIGHT ||
		x < 0 ||
		y < 0) {
		return;
	}

	let horitonzal_index = x >> 1;
	let buffer_index = horitonzal_index + ((this.horizontal_chunks << 1) * y) // quel element du buffer faut-il modifier pour changer ce pixel ?
	let oled_subcolumn_state = this.buffer[buffer_index];
	let right_col = x & 0x1; // chaque entrée du buffer représente 2 pixels. On détermine ici si x concerne le pixel de gauche ou de droite représenté par oled_subcolumn_state. ( true si x est impair )
	let sub_col_left = oled_subcolumn_state >> 4; // qu'est-ce qu'on a dans la col 0 (gauche) ?
	let sub_col_right = oled_subcolumn_state & 0x0f; // qu'est-ce qu'on a dans la col 1 (droite) ?

	if (right_col) { // si x doit changer le pixel de droite
		this.buffer[buffer_index] = sub_col_left << 4 | color; // buffer[buffer_index] = pixel de gauche intact + nouveau pixel
	} else { // si x doit changer le pixel de gauche
		this.buffer[buffer_index] = color << 4 | sub_col_right; // buffer[buffer_index] = nouveau pixel + pixel de droite intact
	}
}

// Algorithme de Bresenham (ligne droite)
Oled.prototype.drawLine = function(x0, y0, x1, y1, color) {

	let dx = Math.abs(x1 - x0),
		sx = x0 < x1 ? 1 : -1,
		dy = Math.abs(y1 - y0),
		sy = y0 < y1 ? 1 : -1,
		err = (dx > dy ? dx : -dy) / 2;
	while (true) {
		this.drawPixel(x0, y0, color);

		if (x0 === x1 && y0 === y1)
			break;

		var e2 = err;

		if (e2 > -dx) {
			err -= dy;
			x0 += sx;
		}
		if (e2 < dy) {
			err += dx;
			y0 += sy;
		}
	}

}

Oled.prototype.fillRect = function(x, y, w, h, color) {
	for (var i = x; i < x + w; i += 1) {
		this.drawLine(i, y, i, y + h - 1, color, false);
	}
}

Oled.prototype.load_and_display_logo = async function() {

	try {
		let data = await fs.promises.readFile("logo.logo");
		data = data.toString().split("\n");
		let flip = true;
		let p = 0;
		for (let d of data) {
			while (d--) {
				this.drawPixel(p % this.WIDTH, ~~(p / this.WIDTH), flip * 7);
				p++;
			}
			flip = !flip;
		}
		await this.update();
	} catch (e) {
		console.log("error while displaying logo", e)
	}

}

module.exports = Oled;