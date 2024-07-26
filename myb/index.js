'use strict';

var libQ = require('kew');
const translations_en = require('./i18n/strings_en.json');
const translations_it = require('./i18n/strings_it.json');
const translations_es = require('./i18n/strings_es.json');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var axios = require('axios');

axios.defaults.baseURL = 'https://api.musicyourbrand.com/api'

module.exports = ControllerMyb;

function ControllerMyb(context) {
  var self = this;

  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
}

// //********************    SYNCHRONIZATION FUNCTION   ***************************//
// ControllerMyb.prototype.syncSDCard = function () {
//   try {
//     execSync('/bin/sync');
//     console.log('Synchronization command /bin/sync executed successfully.');
//   } catch (error) {
//     console.error('Error executing /bin/sync:', error);
//   }
// };

ControllerMyb.prototype.onVolumioStart = function () {
  try {


    var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);
  } catch (error) {
    console.error('Error loading plugin:', error);
  }

  return libQ.resolve();
}

ControllerMyb.prototype.firstCallOnStart = function () {

  axios.defaults.baseURL = 'https://api.musicyourbrand.com'
  setTimeout( () => { 
  
    axios.get('/')
      .then(resp => {
        this.loginOnStart();
      }).catch(err => {
        if (err) {
          this.firstCallOnStart();
          
        }
      })
  }, 1000)
}

ControllerMyb.prototype.loginOnStart = function () {
  var defer = libQ.defer();
  
  axios.defaults.baseURL = 'https://api.musicyourbrand.com/api'
  try {
    var token = this.getConfigData('token');
    if (token) {
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      this.loginWithToken(); 
      defer.resolve();
      return defer.promise;
    } else {
      this.saveConfigData('authenticated', false);
      defer.resolve();
      return defer.promise;
    }
    
    
  } catch (error) {
    this.saveConfigData('authenticated', false);

    if (error && error.response && error.response.status === 403 &&
        typeof error.response.data === 'string' && error.response.data.includes('Token expired') &&
        error.config && !error.config.regenerating_token) {
      this.regenerateToken();
    }

    ('Failed to start myb plugin:', error);

      defer.resolve();
      return defer.promise;
  }
}

ControllerMyb.prototype.onStart = function () {
  var defer = libQ.defer();
  try {
    this.firstCallOnStart();
    defer.resolve();
    return defer.promise;
  } catch (error) {
    
  }
  // try {
  //   var token = this.getConfigData('token');
  //   if (token) {
  //     axios.defaults.headers.common["Authorization"] = "Bearer " + token;
  //     this.loginWithToken(); 
  //     defer.resolve();
  //     return defer.promise;
  //   } else {
  //     this.saveConfigData('authenticated', false);
  //     defer.resolve();
  //     return defer.promise;
  //   }
    
    
  // } catch (error) {
  //   this.saveConfigData('authenticated', false);

  //   if (error && error.response && error.response.status === 403 &&
  //       typeof error.response.data === 'string' && error.response.data.includes('Token expired') &&
  //       error.config && !error.config.regenerating_token) {
  //     this.regenerateToken();
  //   }

  //     defer.resolve();
  //     return defer.promise;
  // }
};

ControllerMyb.prototype.getI18n = function (key) {

  var languageCode = this.commandRouter.sharedVars.get('language_code');
 
  switch (languageCode) {
    case 'it':
      return translations_it.UI[key];
        break;
    case 'es':
      return translations_es.UI[key]
        break;
    case 'en':
    default:
      return translations_en.UI[key]
        break;
  }
};




//**************   LOGIN   ***********+*//

ControllerMyb.prototype.login = function (req, res) {
  var self = this;
  var defer = libQ.defer();
  try {
    axios.post("/login", {
      email : req.email,
      password: req.password
    }).then(resp => {
      if (resp.data) {
        var token = resp.data.token
        var regenerate_token = resp.data.regenerate_token
        var role = resp.data.role
        
        
        self.saveConfigData('token', token);
        self.saveConfigData('regenerate_token', regenerate_token);
        self.saveConfigData('authenticated', true);
        self.saveConfigData('role', role);
        // this.syncSDCard()
        axios.defaults.headers.common["Authorization"] = "Bearer " + token;
        
        if(role == 'radio') {
          var radios = resp.data.user
          self.saveConfigData('radios', radios);
        }
        self.callToListRadio();
        
        self.commandRouter.pushToastMessage('success', self.getI18n('LOGIN'), self.getI18n('LOGIN_SUCCESSFUL'));
        self.pushUiConfig();
        
        defer.resolve();
        return defer.promise;
      }
    }).catch((error) => {
      if(error.response.data.status == 'error') self.commandRouter.pushToastMessage('error', self.getI18n('ERROR'), self.getI18n('LOGIN_FAILED'));
    })
    

  } catch (error) {
   
  }
  
};

//************* LOGINWITHTOKEN ***************//

ControllerMyb.prototype.loginWithToken = function () {
  var defer = libQ.defer();
  
  axios.post("/loginWithToken").then(resp => {
    
    this.saveConfigData('authenticated', true);
    
    var role = resp.data.role;
    this.saveConfigData('role', role);
    
    if (role === 'radio') {
      var radios = resp.data.user;
      this.saveConfigData('radios', radios);
    }
    
    this.callToListRadio();
    
    defer.resolve();
    return defer.promise;

  }).catch((error) => {
    this.saveConfigData('authenticated', false);
    console.error('Error in loginWithToken:', error);
    return Promise.reject(new Error('Failed to login with token'));
  })


}


//**************   LOGOUT   ***********+*//

ControllerMyb.prototype.logout = function () {
  var self = this;

  self.saveConfigData('token', null);
  self.saveConfigData('regenerate_token', null);
  self.saveConfigData('authenticated', false);
  self.saveConfigData('role', null);
  // this.syncSDCard()

  delete axios.defaults.headers.common["Authorization"];
  self.removeAllRadios();
  self.removeToBrowseSources();
  //self.commandRouter.pushToastMessage('success', "Logout", "Logout effettuato con successo");
  
  self.commandRouter.pushToastMessage('success', self.getI18n('LOGOUT'), self.getI18n('LOGOUT_SUCCESSFUL'));

  self.pushUiConfig();
};


ControllerMyb.prototype.removeAllRadios = function () {
  this.saveConfigData('radios', null);
};


//**************   REGENERATE TOKEN   ***********+*//
ControllerMyb.prototype.regenerateToken = function () {
  var defer = libQ.defer();
  
  var regenerate = this.getConfigData('regenerate_token');
  axios.post("/regenerateToken", {
    regenerate_token: regenerate
  }).then( resp => {
    if(resp.data.status == 'success') {
      var token = resp.data.token
      var regenerate_token = resp.data.regenerate_token
      //var role = resp.data.role
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      this.saveConfigData('token', token);
      this.saveConfigData('regenerate_token', regenerate_token);
      // this.syncSDCard()
      
      this.loginWithToken();
      
      defer.resolve();
      return defer.promise;
    }
  }).catch(error => {
    this.saveConfigData('authenticated', false);
  })

}


ControllerMyb.prototype.removeToBrowseSources = function () {
  this.commandRouter.volumioRemoveToBrowseSources('Music Your Brand');
};

ControllerMyb.prototype.callToListRadio = function () {
  var defer = libQ.defer();
  try {
    var role = this.getConfigData('role');
    
    if(role == 'customer') {
      this.removeAllRadios();
      axios.get("/radio/list").then(resp => {
        const radiosFiltered = Object.values(resp.data).filter(radio => radio.status != 'expired');
        this.saveConfigData('radios', radiosFiltered);
      }).catch(error => {
      }) 
    }
  
    this.addToBrowseSources();
  
    defer.resolve();
    return defer.promise;
  } catch (error) {
    
  }
}

ControllerMyb.prototype.onStop = function () {
  var self = this;
  var defer = libQ.defer();

  self.removeAllRadios();
  self.removeToBrowseSources();
  // Once the Plugin has successfully stopped resolve the promise
  defer.resolve();

  return defer.promise;
};

ControllerMyb.prototype.onRestart = function () {
  var self = this;

  this.onStart();
  // Optional, use if you need it
};

// Configuration Methods -----------------------------------------------------------------------------


ControllerMyb.prototype.pushUiConfig = function () {
  var self=this;

  setTimeout(()=>{
    var config = self.getUIConfig();
    config.then((conf)=> {
      self.commandRouter.broadcastMessage('pushUiConfig', conf);
    });
  }, 3000);
};


ControllerMyb.prototype.getUIConfig = function () {
  var defer = libQ.defer();
  var self = this;

  var lang_code = this.commandRouter.sharedVars.get('language_code');

  var authenticated = this.getConfigData('authenticated');

  var config = ''
  if(authenticated) {
    config = '/UIConfigLogout.json';
  } else config = '/UIConfigLogin.json'

  self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + config)
    .then(function (uiconf) {
      defer.resolve(uiconf);
    })
    .fail(function () {
      defer.reject(new Error());
    });

  return defer.promise;
};

ControllerMyb.prototype.getConfigurationFiles = function () {
    return ['config.json'];
}

ControllerMyb.prototype.setUIConfig = function (data) {
  var self = this;
};

ControllerMyb.prototype.getConf = function (varName) {
    var self = this;
    // Perform your installation tasks here
};

ControllerMyb.prototype.setConf = function (varName, varValue) {
    var self = this;
    // Perform your installation tasks here
};

ControllerMyb.prototype.saveConfigData = function (key, value) {
  var self = this;
  self.config.set(key, value);
  self.config.save();
};

ControllerMyb.prototype.getConfigData = function (key) {
  var self = this;
  return self.config.get(key);
};



ControllerMyb.prototype.saveRadioPlayed = function (radio) {
  var self = this;
  self.saveConfigData('radio_played', radio);
};


ControllerMyb.prototype.getRadioPlayed = function () {
  var self = this;
  return self.config.get('radio_played') || [];
};

//*********** AGGIUNGO LE RADIO *************//

ControllerMyb.prototype.addToBrowseSources = function () {
  var radios = Object.values(this.getConfigData('radios'));

  if (!radios) {
    console.error('Nessuna radio disponibile da aggiungere alle sorgenti di navigazione.');
    return;
  }
  
    var data = {
      name: 'Music Your Brand',
      uri: 'myb',
      plugin_type: 'music_service',
      plugin_name: 'myb',
      albumart: '/albumart?sourceicon=music_service/myb/logo-music-your-brand.png'
    };
    this.commandRouter.volumioAddToBrowseSources(data);

    //***** CREAZIONE DELLA CARTELLA ******//
};



ControllerMyb.prototype.handleBrowseUri = function(curUri) {
  var self = this;
  var defer = libQ.defer();
  if (curUri.startsWith('myb')) {
    if (curUri === 'myb') {
      self.listRadioRoot().then(function(response) {
        defer.resolve(response);
      }).fail(function(error) {
        defer.reject(error);
      });
    } else if (curUri.startsWith('myb/radio/')) {
      defer.reject(error);
    }
  } else {
    defer.reject(new Error('URI non riconosciuto.'));
  }

  return defer.promise;
   //***** resta in ascolto intercettando quello che clicco ******//
};


ControllerMyb.prototype.listRadioRoot = function() {
  var self = this;
  var defer = libQ.defer();
  
  var response = {
    navigation: {
      prev: {
        uri: ''
      },
      lists: [
        {
          title: 'Radio Myb',
          icon: 'fa fa-music',
          availableListViews: ['list', 'grid'],
          items: []
        }
      ]
    }
  };

  var role = self.getConfigData('role');
  var radios = []
  if(role == 'radio') {
    var radio = self.getConfigData('radios');
    radios.push(radio);
  } else if(role == 'customer') {
    radios = Object.values(self.getConfigData('radios'));
  }
  //var radios = self.getConfigData('radios');

  if (radios && radios.length >= 0) {
    radios.forEach(radio => {
      response.navigation.lists[0].items.push({
        service: 'webradio',
        type: 'webradio',
        title: radio.name,
        artist: '',
        album: '',
        icon: 'fa fa-play-circle',
        uri: radio.stream
      });
    });
  } else {
    response.navigation.lists[0].items.push({
      service: 'myb',
      type: 'item-no-menu',
      title: 'Nessuna radio disponibile',
      icon: 'fa fa-exclamation-circle'
    });
  }
  defer.resolve(response);
  return defer.promise;
};




ControllerMyb.prototype.search = function(query) {
  var self = this;
  var defer = libQ.defer();

  let searchQuery;
  if (typeof query === 'object' && query.value) {
    searchQuery = query.value.toString().trim().toLowerCase();
  } else if (typeof query === 'string') {
    searchQuery = query.trim().toLowerCase();
  } else {
    console.error('Invalid search query:', query);
    defer.resolve([]);
    return defer.promise;
  }

  var role = self.getConfigData('role');
  var radios = []
  if(role == 'radio') {
    var radio = self.getConfigData('radios');
    radios.push(radio);
  } else if(role == 'customer') {
    radios = Object.values(self.getConfigData('radios'));
  }

  // Filtro sul nome
  var results = radios.filter(radio => {
    if (radio.name && typeof radio.name === 'string') {
      return radio.name.toLowerCase().includes(searchQuery);
    }
    return false;
  });

  var list = [];
  if (results.length > 0) {
    var radioList = results.map(radio => {
      return {
        service: 'webradio',
        type: 'webradio',
        title: radio.name,
        artist: '',
        album: '',
        icon: 'fa fa-play-circle',
        uri: radio.stream
      };
    });

    list.push({
      type: 'title',
      title: 'Risultati della ricerca',
      availableListViews: ["list", "grid"],
      items: radioList
    });
  } else {
    list.push({
      type: 'title',
      title: 'Nessun risultato trovato',
      availableListViews: ["list", "grid"],
      items: [{
        service: 'myb',
        type: 'item-no-menu',
        title: 'Nessuna radio disponibile',
        icon: 'fa fa-exclamation-circle'
      }]
    });
  }

  defer.resolve(list);
  return defer.promise;
};

























// ControllerMyb.prototype.playFunction = function () {
//   var self = this;
//   var radios = self.getConfigData('radios');
//   var radiosActive = Object.values(radios).find(radio => radio.stream);

//   console.log('radio play function ' ,radiosActive);


//   if (radiosActive && radiosActive.stream) {
//       var command = {
//           'uri': radiosActive.stream,
//           'title': radiosActive.name,
//           'service': 'webradio'
//       };

//       self.commandRouter.replaceAndPlay(command).then(response => {
//           self.logger.info(`Riproduzione avviata: ${radiosActive.name}`);
//       }).catch(error => {
//           self.logger.error(`Errore durante la riproduzione: ${error}`);
//       });
//   } else {
//       console.error('Nessuna radio con lo streaming disponibile trovata.');
//   }

//   console.log('terminato play function');
// }



//un giorno per le tracce
// ControllerMyb.prototype.playRadioById = function(radioId) {
//   var self = this;
//   var defer = libQ.defer();

//   var radios = Object.values(self.getConfigData('radios'));
//   var radio = radios.find(r => parseInt(r.id) == parseInt(radioId));

//   if (radio) {
//       // Prepara il comando di riproduzione
//       console.log('=============== dentro playRadioById', radio );
//       var track = {
//           service: 'myb',
//           type: 'webradio', // Tipo di servizio di streaming
//           title: radio.name,
//           uri: radio.stream, // URL del flusso della radio
//           albumart: '/path/to/default/albumart.jpg' // Immagine di copertina predefinita
//       };

//       // Avvia la riproduzione
//       self.commandRouter.volumioPlay({ items: [track] }).then(function() {
//           defer.resolve();
//       }).catch(function(error) {
//           defer.reject(error);
//       });
//   } else {
//       defer.reject(new Error('Radio non trovata.'));
//   }

//   return defer.promise;
// };

// //funziona
// ControllerMyb.prototype.handleBrowseUri = function(curUri) {
//   var self = this;
//   var defer = libQ.defer();
//   console.log('------------- handleBrowseUri curUri ', curUri);
//   if (curUri.startsWith('myb')) {
//       if (curUri == 'myb') {
//           console.log('-----------prima di listRadioRoot');
//           self.listRadioRoot().then(function(response) {
//               defer.resolve(response);
//           }).fail(function(error) {
//               defer.reject(error);
//           });
//       } else if (curUri.startsWith('myb/radio/')) {
//         console.log('-----------prima di listRadio');
//           self.listRadio(curUri).then(function(response) {
//               defer.resolve(response);
//           }).fail(function(error) {
//               defer.reject(error);
//           });
//       }
//   } else {
//       defer.reject(new Error('URI non riconosciuto.'));
//   }

//   //mette in ascolto la cartella e al click  fa partire handleBrowseUri che poi andrà su listRadioRoot
//   return defer.promise;
// };
