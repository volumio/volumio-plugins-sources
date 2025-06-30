const os = require("os");
const date = require('date-and-time');
const oled = require('./oled.js');
const fonts = require('./fonts.js');
const fs = require("fs");
const http = require("http");
const {volumio_listener} = require("./volumiolistener.js");


function ap_oled(){
  
  // Default params that can be overriden with loadConfig (later in runtime) : 
  this.width =  256;
	this.height = 64;
  this.dcPin = 27;
  this.rstPin = 24;
  this.contrast = 254;
  this.main_rate = 32;
  this.base_refresh_track = 20;
  
  this.time_before_screensaver = 60000;
  this.time_before_deepsleep = 120000;
  this.time_before_clock =  6000;
  
  this.logo_duration =  2000;
  
  
  // Cache of streamer state
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
  
  
  // Renderer inner state
	this.page = null;
  this.ip = null;
  
	this.raw_seek_value = 0;
	this.footertext = "";
  this.text_to_display = "";
  
  this.scroller_x = 0;
	this.update_interval = null;
  
	this.refresh_action = null;
  
}

ap_oled.prototype.initSpiDriver = async function(){
  this.driver = new oled(this.width, this.height, this.dcPin, this.rstPin, this.contrast ); // initialize SPI Driver
  await this.driver.begin();  // send display init sequence
}

ap_oled.prototype.loadConfig = async function(){
	
  let config = {};
  try{
    let raw_config = await fs.promises.readFile("config.json");
    let conf = JSON.parse( raw_config.toString() );
		
		Object.entries(conf).forEach( ([key,data])=>{
			
			switch(key){
				
				case "sleep_after": 
					this.time_before_screensaver = data.value * 1000;
				break;
				
				case "deep_sleep_after": 
					this.time_before_deepsleep = data.value * 1000;
				break;
				
				case "contrast": 
					if(data.value > 0 && data.value < 255) this.contrast = data.value;
					else console.warn("Contrast defined in config file is invalid, ignoring...")
				break;
				
			}
			
		} )
		
  }
  catch(err){
    console.log("Cannot read config file. Using default settings instead.", err) 
    config = null;
  }

	
}

ap_oled.prototype.begin = async function(){
 
  await this.initSpiDriver();
  
  await Promise.all([
  	this.driver.load_and_display_logo(),
    // new Promise(resolve => setTimeout(x=>resolve(), this.logo_duration)),   // all this block must take at least [logo_duration] *1ms (load more stuff while logo is loading, but do not "blink logo if loading was too fast")
    this.driver.load_hex_font("unifont.hex")
  ]);
	
	await new Promise(resolve => setTimeout(x=>resolve(), this.logo_duration))   // all this block must take at least [logo_duration] *1ms (load more stuff while logo is loading, but do not "blink logo if loading was too fast")

  // make sure display gets turned off when our process is terminated
	const exitcatch = async ()=> {
    try{
      clearInterval(this.update_interval); // security net just in case ap_oled was just about to start a new update
      await this.driver.turnOffDisplay();
    }
    catch(err){
      
    }
		process.exit();
	}

	process.on('SIGINT',  async e=> await exitcatch()	);
	process.on('SIGTERM', async e=> await exitcatch() );



  //  map what happens in Volumio => what is shown on display
  
  const streamer = new volumio_listener();

  streamer.on("volumeChange", (data)=>{ 
    this.data.volume = data;
  });

  streamer.on("stateChange", (data)=>{ 
    this.data.status = data;
  } );

  streamer.on("trackChange", (data)=>{
    this.text_to_display = data ;
    this.driver.CacheGlyphsData( data);
    this.text_width = this.driver.getStringWidthUnifont(data + " - ");
    this.scroller_x = 0;
    this.reset_refreshTrack();
    this.footertext = "";
    updatefooter();
  });

  streamer.on("seekChange", (data)=>{
    this.data.ratiobar =  ( data.ratiobar * (this.width - 6) );
    this.data.seek_string =  ( data.seek_string );
  });

  streamer.on("repeatChange", (data)=>{
    if(streamer.data.repeat || streamer.data.repeatSingle ) this.data.repeat = true;
    else this.data.repeat = null;
  });

  streamer.on("encodingChange", (data)=>{
    this.data.trackType = data;
  });

  function updatefooter(){
    this.footertext = "";
    if ( streamer.data.samplerate ) this.footertext +=  streamer.data.samplerate.toString().replace(/\s/gi,"") + " ";
    if ( streamer.data.bitdepth   ) this.footertext +=  streamer.data.bitdepth.toString().replace(/\s/gi,"") + " ";
    if ( streamer.data.bitrate    ) this.footertext +=  streamer.data.bitrate.toString().replace(/\s/gi,"") + " ";
  }

  streamer.on("sampleRateChange", (data)=>{updatefooter()});
  streamer.on("sampleDepthChange", (data)=>{updatefooter()});
  streamer.on("bitRateChange", (data)=>{updatefooter()});

  streamer.watchIdleState(this.time_before_clock);
  streamer.on("iddleStart", (data)=>{this.handle_sleep(false)});
  streamer.on("iddleStop", (data)=>{this.handle_sleep(true)});

  this.playback_mode();
  this.listen_to("ip",1000);



  
}

ap_oled.prototype.startHTTPServer = function(){
  
 const server = async (req,res)=> {
   
    let cmd = req.url.split("\/")[1];
    value = cmd.split("=");
    cmd = value[0];
    value = value[1];
    
    switch(cmd){
      case 'exit':
        res.end("1");
        process.exit(0);
        break;
      case 'contrast':
        value = parseInt(value);
        if( value < 255 && value > 0 ){
          if(value === this.contrast) return res.end("1");; // do not bother SPI driver if value did not change
          let temp = this.refresh_action;
					
					res.end("1");
          this.contrast = value;
					
          this.refresh_action = async () =>{
            this.refresh_action = ()=>{};
            await this.driver.setContrast(value);
            this.refresh_action = temp;
            this.refresh_action();
          };
        }
        else{ res.end("0") }
        break;
      case 'sleep_after':
        this.time_before_screensaver = value;
        res.end("1");
        break;
      case 'deep_sleep_after':
        this.time_before_deepsleep = value;
        res.end("1");
        break;
      default:
        res.end("0");
        break;
    }
  }
    
  this.httpServer = http.createServer(server).listen(4153);
  
  
  
}

ap_oled.prototype.reset_refreshTrack = function(){
  this.refresh_track = this.base_refresh_track;
}

ap_oled.prototype.listen_to = function(api,frequency){
	frequency= frequency || 1000;
	let api_caller = null;
  if( api === "ip" ){
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
	
	this.reset_refreshTrack
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

	this.update_interval = setInterval( ()=>{ this.refresh_action() }, this.main_rate);
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
				this.iddle_timeout = setTimeout(_deepsleep_,this.time_before_deepsleep);
			}
			this.clock_mode();
			this.iddle_timeout = setTimeout(_screensaver_,this.time_before_screensaver);
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
	

;(async ()=>{
 
 const rendererSSD1322 = new ap_oled();
 await rendererSSD1322.loadConfig();
 await rendererSSD1322.begin();
 rendererSSD1322.startHTTPServer();
 
 
})();
  
  