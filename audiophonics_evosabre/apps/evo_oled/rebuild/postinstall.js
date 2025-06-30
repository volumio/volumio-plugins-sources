#! /bin/node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ABI = process.versions.modules;

function cleanup(){
	return Promise.all([
		fs.promises.rm( path.join(__dirname, "node_modules"),				{recursive : true, force : true} ),
		fs.promises.rm( path.join(__dirname, "package-lock.json"),	{recursive : true, force : true} ),
	]);
}

;( async ()=>{
		
	let code = 0;
	try{
		const spibin_src = path.join(__dirname, "node_modules", "spi-device", "build", "Release", "spi.node" );
		const spibin_dst = path.join(__dirname, "..", "bin", ABI, "spi.node" );
		await fs.promises.mkdir(path.dirname(spibin_dst), { recursive: true });
		await fs.promises.rename(spibin_src, spibin_dst);
	}
	catch(err){
		console.warn(err)
		code = 1;
	}
	finally{
		await cleanup();
		process.exit(code);
	}

})();