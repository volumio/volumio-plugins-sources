require('keypress')(process.stdin);

var config = new (require('v-conf'))();
var libQ = require('kew')
var fs = require('fs');
var path= "./rotaryencoder2/";
var uiconf= JSON.parse(fs.readFileSync(path + 'UIConfig.json', 'utf8'));
var translationRegEx = /TRANSLATE.([A-Z_0-9]*)/

const volumioSimulator = {
    path: path,
    // var uiconf = {
    //     sections: [
    //         {content: [
    //             {},{value:{value:'',label:''}},{}
    //         ]},
    //         {content: [
    //             {value:{value:'',label:''}},{value:{value:'',label:''}},{},{},{},{},{},{},{},{},{}
    //         ]},
    //         {content: [
    //             {}
    //         ]}
    //     ]
    // }

    coreCommand: {
        pluginManager: {
            getConfigurationFile: (context, filename)=>{return context.path + filename},
        },
        executeOnPlugin: (a,b,c,d) => {
            if (c== 'getAlsaCards') {
                return [{id:'hallo', name:'Device A'},{id:'test', name: 'Device B'}]
            } else if (c=='getConfigParam') {
                return 'hallo'
            } else {
                return {'p1': a,'p2': b, 'p3': c, 'p4':d}
            }
        },
        pushToastMessage: (a,b,c) => {
            console.log(a + ' ' + b + ' ' + c)
        },
        sharedVars:{
            get: (val) =>{
                switch (val) {
                    case 'language_code':
                        return "de";
                        break;
                
                    default:
                        break;
                }
            }
        },
        i18nJson: (lang, lang_def, ui) =>{
           var lang = JSON.parse(fs.readFileSync(lang, 'utf8'));

            var defer = libQ.resolve(uiconf);            
            return defer;
        },
        getUIConfigOnPlugin: () => {
            return libQ.resolve()
        },
        broadcastMessage: () => {
        }
    },
    logger: {
        info: (msg) => {console.log("INFO: ",msg)},
        error: (msg) => {console.log("ERROR: ",msg)},
        warn: (msg) => {console.log("WARNING: ",msg)}
    },
    configManager: {
        pushUIConfigParam: (p1 ,p2, p3) => {
            // console.log(JSON.stringify(p1) + ';' + p2 + ';' + JSON.stringify(p3))
        }
    } 
}
const plugin = new(require('../index.js'))(volumioSimulator);

plugin.onVolumioStart()
.then(_=>plugin.onStart())
// .then(_=>plugin.getUIConfig())
.then(_=> {
    // make `process.stdin` begin emitting "keypress" events

})

process.stdin.on('keypress', function (ch, key) {
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 'w') {
        plugin.emitDialCommand(1,1)
    };
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 's') {
        // plugin.updateSerialSettings(data);            
    };
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 'a') {
        // plugin.updateAmpType(data);            
    };
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 'b') {
        // var data = {
        //     'tcp_ip': false,
        //     'ip_address': '',
        //     'serial_interface_dev':'usb-Prolific_Technology_Inc._USB-Serial_Controller_D-if00-port0',
        //     'amp_type':{'label':'Rotel - A12'},
        //     'volumio_input': {'label':'Opt1'},
        //     'min_volume': 0,
        //     'max_volume': 35,
        //     'startup_volume': 10,
        //     'volume_steps': 1,
        //     'map_to_100': false,
        //     'pause_when_muted': true,
        //     'pause_when_input_changed':true,
        //     'switch_input_at_play': true,
        //     'start_at_powerup':false
        // };
        // plugin.updateAmpType(data);            
    };
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 'v') {
        // plugin.getVolumeObject();
    };
    if (ch == '+') {
        // plugin.alsavolume('+');
    };
    if (ch == '-') {
        // plugin.alsavolume('-');
    };
    if (ch == '9') {
        // plugin.alsavolume('9');
    };
    if (ch == '8') {
        // plugin.alsavolume('13');
    };
    if (ch == '1') {
        // plugin.onStart();
    };
    if (ch == '0') {
        // plugin.onStop();
    };
    if (key && key.ctrl && key.name == 'c') {
        process.stdin.pause();
        plugin.onStop()
        .then(_ => {
            plugin = {};
        })
        
        // process.kill(process.pid, "SIGINT");
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();
// var interval = setInterval(function() {
// }, 1000);

