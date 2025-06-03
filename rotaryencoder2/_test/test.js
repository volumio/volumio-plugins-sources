require('keypress')(process.stdin);

var config = new (require('v-conf'))();
var libQ = require('kew')
var fs = require('fs');
var path= "./rotaryencoder2/";
var uiconf= JSON.parse(fs.readFileSync(path + 'UIConfig.json', 'utf8'));
var translationRegEx = /TRANSLATE.([A-Z_0-9]*)/
const testIo = require('socket.io-client');
var socket = testIo.connect('http://localhost:3000');

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
            getConfigurationFile: (context, filename)=>{
                return context.path + filename
            },
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
// const display = new(require('../../eadog_lcd/index.js'))(volumioSimulator);
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
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 'u') {
        plugin.updateEncoder(JSON.parse('{"enabled0":true,"rotaryType0":{"value":2,"label":"1/2"},"pinA0":"17","pinB0":"27","dialAction0":{"value":1,"label":"Lautstärke"},"socketCmdCCW0":"","socketDataCCW0":"","socketCmdCW0":"","socketDataCW0":"","pinPush0":0,"pinPushDebounce0":0,"pushState0":true,"pushAction0":{"value":0,"label":"..."},"socketCmdPush0":"","socketDataPush0":"","longPushAction0":{"value":0,"label":"..."},"socketCmdLongPush0":"","socketDataLongPush0":"","delayLongPush0":"1500","doublePushAction0":{"value":0,"label":"..."},"socketCmdDoublePush0":"","socketDataDoublePush0":"","delayDoublePush0":"700"}'))
        // plugin.updateSerialSettings(data);            
    };
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 'r') {
        let d = "{\"endpoint\":\"system_hardware/eadog_lcd\",\"method\":\"up\",\"data\":\"\"}"
        socket.emit("callMethod", d);
    };
    if (key && !key.ctrl && !key.meta && !key.shift && key.name == 'g') {
        plugin.getUIConfig()
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

