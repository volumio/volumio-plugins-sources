const io = require('socket.io-client' );
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const cp = require('child_process');

function volumio_listener(host,refreshrate_ms){
    this.host = host || 'http://localhost:3000';
    this.refreshrate_ms = refreshrate_ms || 1000;
    this.ready = false;
    this.waiting = false;
    this.state = "stop";
    this.formatedMainString = "";
    this.data = {};
	this.watchingIdle = false;
	this.firstRequestConsumed = false;
	this.listen();
	this.iddle = false;
	this._iddleTimeout = null;
	this.iddletime = 900;
	
}

inherits(volumio_listener, EventEmitter);
exports.volumio_listener = volumio_listener;


/*
	Comparer data vs this.data et executer processChange sur chaque clé contenant une nouvelle valeur.
*/
volumio_listener.prototype.compareData = function(data){
	let changes = [];
	for(d in data){
		let previous_data = this.data[d];
		if(this.data[d] === data[d]  ) continue; 			// ne rien faire si aucun changement 
		this.data[d] = data[d];  				 			// sinon actualiser l'état connu du streamer
		changes.push([d , this.data[d]]);	// marquer que ce changement doit être propagé 
	}
	for(change of changes){
		this.processChanges(...change);			 			// propager chaque changement
	}
}

// résoudre chaque changement d'état
volumio_listener.prototype.processChanges = function(key,data){ 
	
	if( ["title", "artist", "album"].includes(key) ){			// changement de piste
		this.formatMainString();								
		this.emit( "trackChange", this.formatedMainString );	
		if(this.state === "play") this.resetIdleTimeout(); 		// la piste peut changer hors lecture (webradios). Ne pas sortir de veille le cas échéant.
	}
	else if(key === "status"){									// changement d'état (play/pause/stop)
		this.state = data;
		this.resetIdleTimeout();
		this.emit( "stateChange", data );
	}
	else if( ["duration", "seek"].includes(key)){				// avance dans la timeline
		this.resetIdleTimeout();
		this.seekFormat();
		this.emit( "seekChange", this.formatedSeek );
	}
	else if(key === "bitrate"){
		this.emit( "bitRateChange", data );
		this.emit( "line2", "Bit Rate : " + data );
	}
	else if(key === "volume"){									// changement de volume
		this.resetIdleTimeout();
		this.emit( "volumeChange", data );
	}
	else if(key === "samplerate"){
		this.emit( "sampleRateChange", data );
		this.emit( "line0", "Sample Rate : " + data );
	}
	else if(key === "bitdepth"){
		this.emit( "sampleDepthChange", data );
		this.emit( "line1", "Sample Depth : " + data );
	}
	else if(key === "albumart"){								// changement de couverture
			

		if(data === "/albumart"){
		/*
			"/albumart" est l'adresse par défaut si aucune couverture n'est disponible.
			Elle s'affiche aussi durant le changement de piste, ce qui produit souvent
			un effet désagréable sur le LCD où l'image change plusieurs fois rapidement.
			
			ce bloc "if" limite ce phénomène
		*/
			let waitAndEmit, delayedEmit, cancelDelayedEmit;
			
			delayedEmit = ()=>{this.emit( "coverChange",this.host+data );}
			waitAndEmit = setTimeout(delayedEmit, 5000);		// attendre 5 secondes avant de propager "/albumart"
			cancelDelayedEmit = ()=>{clearTimeout(waitAndEmit);}
			this.once("coverChange", cancelDelayedEmit);		// annuler la propagation si la piste suivante a fini de charger avant la fin du timeout.
			return;
		}
		
		if ( /https?:\/\//.test(data) ){		// adresse distante
			this.emit( "coverChange",data );
			return;
		}
		if(data[0] !== "/") data = "/"+data;	// adresse locale
		this.emit( "coverChange",this.host+data );
	}
	else if(key === "uri"){
		this.emit( "file", data );
	}
	else if(key === "channels"){
		this.emit( "channelsChange", data );
		this.emit( "line3", "Channels : " + data );
	}
	else if(key === "trackType"){
		
		let pdata = data.replace(/audio/gi, "");
		this.emit( "encodingChange", pdata );
		this.emit( "line4", "Track Type : " + pdata );
	}
	else if(key === "position"){
		let pdata = parseInt(data)+1;
		this.emit( "songIdChange", pdata );
		let playlistlength = 1;
		if(this.data && this.data.playlistlength) playlistlength = this.data.playlistlength;
		this.emit( "line5", "Playlist : " + pdata + " / " + playlistlength );
	}
	else if(["repeat", "repeatSingle"].includes(key)){
		this.emit( "repeatChange", data );
		this.emit( "line6", "Repeat : " + data );
	}
};

volumio_listener.prototype.listen = function(){
	this._socket = io.connect(this.host);
	this.api_caller = setInterval( ()=>{
		if(this.waiting || this.state !== "play") return;
		this.waiting = true;
		this._socket.emit("getState");
		this._socket.emit("getQueue");
	}, this.refreshrate_ms );

	this._socket.emit("getState");
	
	this._socket.on("pushState", (data)=>{ // changements d'état du streamer
		if(!this.firstRequestConsumed){
			this.firstRequestConsumed = true;
			this._socket.emit("getState");
			return;
		}
		this.compareData(data);
		this.waiting = false;
	})
	this._socket.emit("getQueue");
	this._socket.on("pushQueue", (resdata)=> {	// changements dans la playlist
		if(resdata && resdata[0]){
			let additionnalTrackData = resdata[0], filteredData = {};
			/*
				Rien ne garantit que le streamer et la playlist sont toujours 
				d'accord (en particulier concernant les métadonnées des webradio) 
				-> on filtre les entrées
			 */
			filteredData.playlistlength = resdata.length;
			this.compareData(filteredData);}
		}
	);
}

volumio_listener.prototype.seekFormat = function (){
	
	let ratiobar, 
		seek_string, 
		seek = this.data.seek,
		duration = this.data.duration;
		
		
	try{
		if(!duration) ratiobar = 0;
		else ratiobar =  seek / (duration * 1000) ;
	}
	catch(e){
		ratiobar = 0;
	}	
	try{
		duration = new Date(duration * 1000).toISOString().substr(14, 5);
	}
	catch(e){
		duration = "00:00";
	}
	try{
		seek = new Date(seek).toISOString().substr(14, 5);
	}
	catch(e){
		seek = "";
	}
	seek_string = seek + " / "+ duration;
	this.formatedSeek = {seek_string:seek_string,ratiobar:ratiobar};
	return(this.formatedSeek);
}

volumio_listener.prototype.formatMainString = function (){
	this.formatedMainString = this.data.title + (this.data.artist?" - " + this.data.artist:"") + (this.data.album?" - " + this.data.album:"");
}

// considérer que le streamer est inactif (en veille) après un certain temps d'inactivité
volumio_listener.prototype.watchIdleState = function(iddletime){
	this.watchingIdle = true;
	this.iddletime = iddletime;
	clearTimeout(this._iddleTimeout);
	this._iddleTimeout = setTimeout( ()=>{
		if(! this.watchingIdle ) return;
		this.iddle = true;
		this.emit("iddleStart")
	}, this.iddletime );
}

volumio_listener.prototype.resetIdleTimeout = function(){
	if(! this.watchingIdle ) return;
	if( this.iddle  ) this.emit("iddleStop");
	this.iddle = false;
	this._iddleTimeout.refresh();
}
volumio_listener.prototype.clearIdleTimeout = function(){
	this.watchingIdle = false;
	if( this.iddle  ) this.emit("iddleStop");
	this.iddle = false;
	clearTimeout(this._iddleTimeout);
}



