var superagent = require('superagent');

var apiEndpoint = 'http://127.0.0.1:9879';


superagent.post(apiEndpoint + '/player/volume')
    .accept('application/json')
    .send({ 'volume': 50, 'volume_steps': 100 })
    .then((results) => {
        console.log(results.body);
    }).catch((err) => {
        console.log(err);
    })


superagent.get(apiEndpoint + '/status')
    .accept('application/json')
    .then((results) => {
        console.log(results.body);
    })

superagent.get(apiEndpoint + '/player/volume')
    .accept('application/json')
    .then((results) => {
        console.log(results.body);
    })