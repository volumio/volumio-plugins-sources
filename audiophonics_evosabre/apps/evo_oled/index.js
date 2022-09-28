const os = require("os");
const date = require('date-and-time');
const oled = require('./oled.js');
const fonts = require('./fonts.js');
const fs = require("fs");
const http = require("http");
const {volumio_listener} = require("./volumiolistener.js");




var DRIVER;

var TIME_BEFORE_CLOCK = 6000; // in ms
var TIME_BEFORE_SCREENSAVER = 60000; // in ms
var TIME_BEFORE_DEEPSLEEP = 120000; // in ms
// var LOGO_DURATION = 5000; // in ms
var LOGO_DURATION = 0; // in ms
var CONTRAST = 254; // range 1-254
var extn_exit_sleep_mode = false;


const opts = {
	width: 256,
	height: 64,
	dcPin: 27,
	rstPin : 24,
	contrast : CONTRAST,
	divisor : 0xf1,
	main_rate : 40
};


http.createServer(server).listen(4153);
function server(req,res){
	let cmd = req.url.split("\/")[1];
	value = cmd.split("=");
	cmd = value[0];
	value = value[1];
	extn_exit_sleep_mode = true;
	
	switch(cmd){
		case 'exit':
			res.end("1");
			process.exit(0);
			break;
		case 'contrast':
			if( value < 255 && value > 0 ){
				res.end("1");
				let temp = DRIVER.refresh_action;
				CONTRAST = value;
				DRIVER.refresh_action = function(){
					DRIVER.refresh_action = function(){};
					DRIVER.driver.setContrast(value, ()=>{
						DRIVER.refresh_action = temp;
						DRIVER.refresh_action();
					})
				};
			}
			else{ res.end("0") }
			break;
		case 'sleep_after':
			TIME_BEFORE_SCREENSAVER = value;
			res.end("1");
			break;
		case 'deep_sleep_after':
			TIME_BEFORE_DEEPSLEEP = value;
			res.end("1");
			break;
		default:
			res.end("0");
			break;
	}
}


const REFRESH_TRACK = 20;
var api_state_waiting = false; 

function ap_oled(opts){
	this.scroller_x = 0;
	this.ip = null;
	this.height = opts.height;
	this.width = opts.width;
	this.page = null;
    this.data = {
        title : null,
        artist : null,
        album : null,
        volume : null,
        samplerate : null,
        bitdepth : null,
        bitrate : null,
		seek : null,
		duration : null,
		status : null,
    };
	this.raw_seek_value = 0;
	this.footertext = "";
	this.update_interval = null;
    this.refresh_track = REFRESH_TRACK;
	this.refresh_action = null;
	this.driver = new oled(opts);
	this.text_to_display = "";
}


ap_oled.prototype.listen_to = function(api,frequency){
	frequency= frequency || 1000;
	let api_caller = null;
	
	if(api === "volumio"){
		return;
		var io = require('socket.io-client' );
		var socket = io.connect('http://localhost:3000');
		api_caller = setInterval( 
			()=>{
				if(api_state_waiting) return;
				api_state_waiting = true;
				socket.emit("getState");
			}, frequency );
		let first = true;
		
        socket.emit("getState");
		socket.on("pushState", (data)=> { // se déclenche si changement de morceau / volume / repeat / random / play / pause , ou si l'utilisateur avance manuellement dans la timebar.
			
			let exit_sleep = false;
			if(extn_exit_sleep_mode){
				extn_exit_sleep_mode = false;
				exit_sleep = true;
			}
			if(first){
				first = false;
				socket.emit("getState");
				return;
			}
			api_state_waiting = false;
			
            if( // changement de piste
                this.data.title  !== data.title  || 
                this.data.artist !== data.artist || 
                this.data.album  !== data.album  
            ){
                this.text_to_display = data.title + (data.artist?" - " + data.artist:"") + (data.album?" - " + data.album:"") ;
				this.driver.CacheGlyphsData( this.text_to_display);
				this.text_width = this.driver.getStringWidthUnifont(this.text_to_display + " - ");
				
                this.scroller_x = 0;
                this.refresh_track = REFRESH_TRACK;
				this.footertext = "";
				exit_sleep = true;
            }
			// changement de volume
			if(  this.data.volume !== data.volume ){exit_sleep = true;}
			
			// avance dans la piste
			let seek_data = this.volumio_seek_format( data.seek, data.duration );
			

			
			if(data.status == "play"){exit_sleep = true;}
			
			this.footertext = "";
			if( !data.samplerate && !data.bitdepth && !data.bitrate ) socket.emit("getQueue"); // s'il manque des données, un autre emit permet de compléter les infos pour tout ce qui est fréquence / bitrate
			else{
				if ( data.samplerate ) this.footertext += data.samplerate.toString().replace(/\s/gi,"") + " ";
				if ( data.bitdepth   ) this.footertext += data.bitdepth.toString().replace(/\s/gi,"") + " ";
				if ( data.bitrate    ) this.footertext += data.bitrate.toString().replace(/\s/gi,"") + " ";
			}
			
			this.data = data; // attention à la position de cette commande : une fois cette assignation effectuée, plus aucune comparaison n'est possible avec l'état précédent
			this.data.seek_string = seek_data.seek_string;
			this.data.ratiobar = seek_data.ratiobar;
			
			this.handle_sleep(exit_sleep);	
		
			return api_caller;
		})
		
		socket.on("pushQueue", (resdata)=> {
			let data = resdata[0];
			if( !this.footertext && data ) {
				if ( data.samplerate ) this.footertext += data.samplerate.toString().replace(/\s/gi,"") + " ";
				if ( data.bitdepth   ) this.footertext += data.bitdepth.toString().replace(/\s/gi,"") + " ";
				if ( data.bitrate    ) this.footertext += data.bitrate.toString().replace(/\s/gi,"") + " ";
			}
		});

	}
	
	else if( api === "ip" ){
		api_caller = setInterval( ()=>{this.get_ip()}, frequency );
		return api_caller;
	}

}

ap_oled.prototype.snake_screensaver = function(){
if (this.page === "snake_screensaver") return;
	clearInterval(this.update_interval);
	this.page = "snake_screensaver";
	
	let box_pos = [0,0];
	let count = 0;
	let flip = false;
	let tail = [];
	let tail_max = 25;
	let t_tail_length = 1;
	let random_pickups = [];
	let screen_saver_animation_reset =()=>{
		tail = [];
		count = 0;
		t_tail_length = 10;
		random_pickups = [];
		let nb = 7;
		while(nb--){
			let _x =  Math.floor(Math.random() * (this.width ));
			let _y =  Math.floor(Math.random() * (this.height/3))*3;
			random_pickups.push([_x,_y]);
		}	
	}
	screen_saver_animation_reset();
	this.refresh_action = ()=>{
		this.driver.buffer.fill(0x00);
		let x;
		if( count % this.width == 0) {flip = !flip}
		if(flip) x = count % this.width +1
		else x = this.width - count % this.width
		let y = ~~( count / this.width ) *3
		tail.push([x,y]);
		if(tail.length > t_tail_length ) tail.shift();
		for(let i of tail){
			this.driver.fillRect(i[0],i[1]-1,2,3,1);
		}
		for(let r of random_pickups){
			if(  ( ( flip && x >= r[0] ) || ( !flip && x <= r[0] ) ) && y >= r[1] ){ 
				t_tail_length +=5;
				random_pickups.splice(random_pickups.indexOf(r),1)
			}
			this.driver.fillRect(r[0],r[1],1,1,1);
		}
		count++;
		this.driver.update(true);
		if(y > this.height ) screen_saver_animation_reset();
	}
	this.update_interval = setInterval( ()=>{this.refresh_action()}, 40);
}

ap_oled.prototype.deep_sleep = function(){
if (this.page === "deep_sleep") return;
	this.status_off = true;
	clearInterval(this.update_interval);
	this.page = "deep_sleep";
	this.driver.turnOffDisplay();

}

ap_oled.prototype.clock_mode = function(){
if (this.page === "clock") return;
	clearInterval(this.update_interval);
	this.page = "clock";
	
	this.refresh_action = ()=>{
		this.driver.buffer.fill(0x00);
		let fdate = date.format(new Date(),'YYYY/MM/DD'),
		ftime = date.format(new Date(),'HH:mm:ss');
		
		this.driver.setCursor(90, 0);
		this.driver.writeString( fonts.monospace ,1,fdate,3);
		
		this.driver.setCursor(50,15);
		this.driver.writeString( fonts.monospace ,3,ftime,6);
		this.driver.drawLine(1, 41, 255, 41, 5, false);
		
		
		this.driver.setCursor(20,47);
		this.driver.writeString(fonts.monospace ,1, (this.ip?this.ip:"No network...") ,4);
		
		
		if(this.data && this.data.volume !== null ){
			let volstring = this.data.volume.toString();
			if(this.data.mute === true || volstring === "0") volstring = "X";
			this.driver.setCursor(185,47);
			this.driver.writeString(fonts.icons , 1 , "0" ,4); 
			this.driver.setCursor(195,47);
			this.driver.writeString(fonts.monospace ,1, volstring ,6);

		}
		this.driver.update(true);
	}
	this.refresh_action();
	this.update_interval = setInterval( ()=>{this.refresh_action()}, 1000);
	
}

ap_oled.prototype.playback_mode = function(){
    
	if (this.page === "playback") return;
	
	clearInterval(this.update_interval);


 	this.scroller_x = 0;
	this.page = "playback";
	
	this.refresh_track = REFRESH_TRACK;
	this.refresh_action =()=>{
		
        if(this.plotting){ return }; // skip plotting of this frame if the pi has not finished plotting the previous frame
		
        this.plotting = true;
		this.driver.buffer.fill(0x00);
		
		if(this.data){
            // volume
            if(this.data.volume !== null ){
                let volstring = this.data.volume.toString();
                if(this.data.mute === true || volstring === "0") volstring = "X";
                
                this.driver.setCursor(0,0);
                this.driver.writeString(fonts.icons , 1 , "0" ,5); 
                this.driver.setCursor(10,1);
                this.driver.writeString(fonts.monospace ,1, volstring ,5);
            }    
			
			// repeat
			if( this.data.repeat ){
				this.driver.setCursor(232,0);
                this.driver.writeString(fonts.icons , 1 , "4" ,5); 
            }
			
			// track type (flac, mp3, webradio...etc.)
			if(this.data.trackType){
				this.driver.setCursor(35,1);
				this.driver.writeString(fonts.monospace , 1 , this.data.trackType ,4); 
			}
		
			// string with any data we have regarding sampling rate and bitrate
			if(this.footertext){
				this.driver.setCursor(0,57);
				this.driver.writeString(fonts.monospace , 1 , this.footertext ,5); 
			}
			
			// play pause stop logo
			if(this.data.status){
                let status_symbol = "";
				switch(this.data.status){
					case ("play"):
						status_symbol = "1";
						break;
					case ("pause"):
						status_symbol = "2"
						break;		
					case ("stop"):
						status_symbol = "3"
						break;
				}    
                this.driver.setCursor(246,0);
                this.driver.writeString(fonts.icons ,1, status_symbol ,6);
			}

			// track title album artists
			if(this.text_to_display?.length){ 
				//  if the whole text is short enough to fit the whole screen
				if( this.text_width <= this.width ){
					this.driver.setCursor( 0, 17 );
					this.driver.writeStringUnifont(this.text_to_display,7 );  
				}
				else{ // text overflows the display (very likely considering it's 256px) : make the text scroll alongside its horizontal direction
					let text_to_display = this.text_to_display;
					text_to_display = text_to_display + " - " + text_to_display + " - ";
					if(this.scroller_x + (this.text_width) < 0 ){
						this.scroller_x = 0;
					}
					this.driver.cursor_x = this.scroller_x;
					this.driver.cursor_y = 14
					this.driver.writeStringUnifont(text_to_display,7 );
				}
			}
			// seek data
			if(this.data.seek_string){
				let border_right = this.width -5;
				let Y_seekbar = 35;
				let Ymax_seekbar = 38;
				this.driver.drawLine(3, Y_seekbar, border_right , Y_seekbar, 3);
				this.driver.drawLine(border_right, Y_seekbar,border_right , Ymax_seekbar, 3);
				this.driver.drawLine(3, Ymax_seekbar,border_right, Ymax_seekbar, 3);
				this.driver.drawLine(3, Ymax_seekbar, 3, Y_seekbar, 3);
				this.driver.cursor_y = 43;
				this.driver.cursor_x = 83;
				this.driver.writeString(fonts.monospace , 1 , this.data.seek_string ,5); 
				this.driver.fillRect(3, Y_seekbar, this.data.ratiobar, 4, 4);
			}
		}
		
		this.driver.update();
		this.plotting = false;
        if(this.refresh_track) return this.refresh_track--; // ne pas updater le curseur de scroll avant d'avoir écoulé les frames statiques (juste après un changement de morceau)
		this.scroller_x--;
	}

	this.update_interval = setInterval( ()=>{ this.refresh_action() },opts.main_rate);
	this.refresh_action();
}


ap_oled.prototype.get_ip = function(){
	try{
		let ips = os.networkInterfaces(), ip = "No network.";
		for(a in ips){
			if( ips[a][0]["address"] !== "127.0.0.1" ){
				ip = ips[a][0]["address"];
				break;
			}
		}
		this.ip = ip;
	}
	catch(e){this.ip = null;}
}


ap_oled.prototype.handle_sleep = function(exit_sleep){
	
	if( !exit_sleep ){ // Est-ce que l'afficheur devrait passer en mode veille ? 
		
		if(!this.iddle_timeout){ // vérifie si l'écran n'attend pas déjà de passer en veille (instruction initiée dans un cycle précédent)
			let _deepsleep_ = ()=>{this.deep_sleep();}
			let _screensaver_ = ()=>{
				this.snake_screensaver();
				this.iddle_timeout = setTimeout(_deepsleep_,TIME_BEFORE_DEEPSLEEP);
			}
			this.clock_mode();
			this.iddle_timeout = setTimeout(_screensaver_,TIME_BEFORE_SCREENSAVER);
		}
	}
	else{
		if(this.status_off){
			this.status_off = null;
			this.driver.turnOnDisplay();
		}
		
		if(this.page !== "spdif" ){
			this.playback_mode();
		}

		if(this.iddle_timeout){
			clearTimeout(this.iddle_timeout);
			this.iddle_timeout = null;
		}
	}
}
	
fs.readFile("config.json",(err,data)=>{
	
	const fail_warn =()=>{ console.log("Cannot read config file. Using default settings instead.") };
	if(err) fail_warn();
	else{
		try { 
			data = JSON.parse( data.toString() );
			console.log("Config loaded :",data);
			TIME_BEFORE_SCREENSAVER = (data && data.sleep_after.value) ? data.sleep_after.value  * 1000 : TIME_BEFORE_SCREENSAVER;
			TIME_BEFORE_DEEPSLEEP = (data && data.deep_sleep_after.value) ? data.deep_sleep_after.value  * 1000 : TIME_BEFORE_DEEPSLEEP;
			CONTRAST = (data && data.contrast.value) ? data.contrast.value : CONTRAST;
		} catch(e){fail_warn()}
	}
	
	opts.contrast = CONTRAST;
	
	const OLED = new ap_oled(opts);
	var logo_start_display_time = 0;
	
	OLED.driver.begin();
		
	DRIVER = OLED;
	OLED.driver.load_and_display_logo( (displaylogo)=>{ 
		console.log("logo loaded")
		if(displaylogo) logo_start_display_time = new Date();
	});
	OLED.driver.load_hex_font("unifont.hex", start_app);

	function start_app(){
		
		
		let time_remaining = 0;
		if(logo_start_display_time){
			time_remaining = LOGO_DURATION - ( new Date().getTime() - logo_start_display_time.getTime() )  ;
			time_remaining = (time_remaining<=0)?0:time_remaining;
		}
		setTimeout( ()=>{
			
			const streamer = new volumio_listener();
			streamer.on("volumeChange", (data)=>{ 
				OLED.data.volume = data;
			});
			streamer.on("stateChange", (data)=>{ 
				OLED.data.status = data;
			} );
			streamer.on("trackChange", (data)=>{
				OLED.text_to_display = data ;
				OLED.driver.CacheGlyphsData( data);
				OLED.text_width = OLED.driver.getStringWidthUnifont(data + " - ");
				OLED.scroller_x = 0;
				OLED.refresh_track = REFRESH_TRACK;
				OLED.footertext = "";
				updatefooter();
			});
			streamer.on("seekChange", (data)=>{
				OLED.data.ratiobar =  ( data.ratiobar * (OLED.width - 6) );
				OLED.data.seek_string =  ( data.seek_string  );
				
			});
			streamer.on("repeatChange", (data)=>{
				if(streamer.data.repeat || streamer.data.repeatSingle ) OLED.data.repeat = true;
				else OLED.data.repeat = null;
			});
			streamer.on("encodingChange", (data)=>{
				OLED.data.trackType = data;
			});
			function updatefooter(){
				OLED.footertext = "";
				if ( streamer.data.samplerate ) OLED.footertext +=  streamer.data.samplerate.toString().replace(/\s/gi,"") + " ";
				if ( streamer.data.bitdepth   ) OLED.footertext +=  streamer.data.bitdepth.toString().replace(/\s/gi,"") + " ";
				if ( streamer.data.bitrate    ) OLED.footertext +=  streamer.data.bitrate.toString().replace(/\s/gi,"") + " ";
			}
			
			streamer.on("sampleRateChange", (data)=>{updatefooter()});
			streamer.on("sampleDepthChange", (data)=>{updatefooter()});
			streamer.on("bitRateChange", (data)=>{updatefooter()});
			
			streamer.watchIdleState(TIME_BEFORE_CLOCK);
			streamer.on("iddleStart", (data)=>{OLED.handle_sleep(false)});
			streamer.on("iddleStop", (data)=>{OLED.handle_sleep(true)});

			

			OLED.playback_mode();
			OLED.listen_to("ip",1000);
		}, time_remaining );
	}

	function exitcatch(options) {
		if (options.cleanup) OLED.driver.turnOffDisplay();
		if (options.exit) process.exit();
	}

	process.on('exit', 		exitcatch.bind( null, { cleanup:true} ));
	process.on('SIGINT', 	exitcatch.bind( null, { exit:true	} ));
	process.on('SIGUSR1',	exitcatch.bind( null, { exit:true	} ));
	process.on('SIGUSR2', 	exitcatch.bind( null, { exit:true	} ));

});

