var superagent = require('superagent');
var fs = require('fs-extra');
var apiEndpoint = 'http://127.0.0.1:9879';
var volumeMap = {};

makeAPIRequest(1);

function makeAPIRequest(value) {
    superagent.post(apiEndpoint + '/player/volume')
        .accept('application/json')
        .send({ 'volume': value, 'volume_steps': 100 })
        .then((results) => {
            console.log('Sent volume: ' + value);
            matchVolumeLevels(value);
        }).catch((err) => {
            console.log('Failed to send volume: ' + value + ' ERROR: ' + err);
        });
}

function matchVolumeLevels(value) {
    superagent.get(apiEndpoint + '/player/volume')
        .accept('application/json')
        .then((results) => {
            volumeMap[results.body.value] = value;
            console.log('Received volume: ' + results.body.value + ' for value: ' + value);
            setTimeout(()=>{
                if (value === 100) {
                    saveVolumeMap();
                } else {
                    var newApiValue = value + 1;
                    makeAPIRequest(newApiValue);
                }
            }, 1000);
        })
}

function saveVolumeMap() {
    console.log('Saving Volume Map')
    console.log(JSON.stringify(volumeMap));
    fs.writeJsonSync('./spotifyDaemonVolumeMap.json', volumeMap)
}
