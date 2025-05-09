const fs = require("fs");
const cp = require("child_process");
const readline = require('readline');

class GpioPermissionError extends Error {}

async function readVFile() {
	
	const stream = fs.createReadStream('/sys/kernel/debug/gpio', { encoding: 'utf8' });
	const rl = readline.createInterface({ input: stream });
	
	const map = {
		gpio : {}, 
		fn : {}, 
		offset : {}
	};

	for await (const line of rl) {
		
		const regsearch = /^\sgpio-(?<offset>\d+)\s+\((?<fn>(GPIO(?<gpio>\d+)).*?|.*?)\s+\)/.exec(line)?.groups;
		
		if(!regsearch) continue;

		const offset =  regsearch.offset ? parseInt( regsearch.offset ) : null;
		const fn =  regsearch.fn ? (regsearch.fn).replace(/\s+/g, "") : null;
		const gpio =  regsearch.gpio ? parseInt(regsearch.gpio) : null;

		const obj = {offset,fn,gpio}
		
		if(gpio) map.gpio[obj.gpio] = obj;
		if(fn) map.fn[obj.fn] = obj;
		if(offset) map.offset[obj.offset] = obj;
		
	}
	
	return map;
}


async function getGpioMapping() {

	return (
	
		// check if we have permission to read from /sys/kernel/debug/gpio
		fs.promises.access("/sys/kernel/debug/gpio", fs.constants.R_OK) 
		
		// if not, try to make it readable
		.catch(
			err => new Promise((resolve, reject) => { 
				cp.exec(
					'/usr/bin/sudo /bin/chmod o+rx /sys/kernel/debug', {
						uid: 1000,
						gid: 1000
					},
					(error, stdout, stderr) => {
						if (error !== null) {
							return reject(error);
						}
						return resolve();
					});
			})
		)
		// if still cannot access, just give up, nothing will happen
		.catch( err =>{
			console.log(err)
			throw new GpioPermissionError("Cannot access /sys/kernel/debug/gpio");
		}) 
		.then(_ => readVFile())
	)

};


module.exports = {getGpioMapping, GpioPermissionError}


