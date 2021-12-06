#!/usr/bin/env node

const IDSTR="MinosseDSP::mdsp-mpdclient.js: ";
const core_fifo = "/tmp/mdsp-core.fifo";

var exec = require('child_process').exec;

// See https://github.com/andrewrk/mpd.js
var mpd = require('/volumio/app/plugins/music_service/mpd/lib/mpd.js');
var cmd = mpd.cmd;
var mpdclient;

async function systemPlayer ()
{
	mpdclient.sendCommand(cmd("status", []), function(err, msg) {
		if (err) throw err;
		/*
		### msg example:
		volume: 100
		repeat: 0
		random: 0
		single: 0
		consume: 0
		playlist: 7
		playlistlength: 1
		mixrampdb: 0.000000
		state: play
		song: 0
		songid: 1
		time: 1:0
		elapsed: 0.853
		bitrate: 128
		audio: 44100:24:2
		*/
		if (msg.includes("state: ")) {
			//console.log(msg);
			
			//var pobj = JSON.parse(msg);
			var commstr = "";
			
			if (msg.includes("state: play") && msg.includes("audio: ")) {
				
				// See https://stackoverflow.com/questions/51708004/how-to-fetch-a-value-from-a-string-in-javascript
				var pobj = {}; //[] for array
				msg.trim('\n').split('\n').map(po => {
					var pel = po.split(': ');
					pobj[pel[0]] = pel[1];
				});
				
				/*
				### pobj.audio examples:
				88200:24:2
				dsd64:2
				*/
				commstr = '/bin/echo \'{"event":"play","data":"' + pobj.audio + '"}\' > ' + core_fifo;
				
			}
			
			if (msg.includes("state: pause")) {
				commstr = '/bin/echo \'{"event":"pause","data":""}\' > ' + core_fifo;
			}
			
			if (msg.includes("state: stop")) {
				commstr = '/bin/echo \'{"event":"stop","data":""}\' > ' + core_fifo;
			}
			
			if (commstr != "") {
				//console.log(IDSTR + commstr);
				exec(commstr,
					function (error, stdout, stderr)
					{
				    	if (error)
						{
				        	console.log(IDSTR + error);
				      	}
				    }
				);
			}
			
		}
	});
}

mpdclientconnection = function()
{
	try {

		// See https://github.com/andrewrk/mpd.js
		mpdclient = mpd.connect({
			port: 6600,
			host: 'localhost',
		});
		
		console.log(IDSTR + 'setting up MPD client connection for audio sample rate and bit depth monitoring');
		
		mpdclient.on('system-player', function() {
			systemPlayer();
		});
		
		mpdclient.on('end', function() {
			mpdclientconnection();
		});
	
	} catch(err) {
		console.log(IDSTR + err);
		//exec('/bin/sleep 1 && /usr/local/bin/mdsp-mpdclient.js');
		commstr = '/bin/echo \'{"event":"start-mpdclient","data":""}\' > ' + core_fifo;
		exec(commstr,
			function (error, stdout, stderr)
			{
		    	if (error)
				{
		        	console.log(IDSTR + error);
		      	}
		    }
		);
	}

}

mpdclientconnection();
