var libQ = require('kew');

function promiseMaker(waittime_s,text) {
    var defer = libQ.defer();
    setTimeout(() => {
        defer.resolve(text)
    }, waittime_s*1000);
    return defer.promise;
}

function sorter() {
    var defer = libQ.defer();
    setTimeout(() => {
        defer.resolve(promiseMaker(5,'hallo'));
    }, 1000);
    console.log('Started timer')
    return defer.promise;
}

sorter()
.then(result => {
    console.log('wait for the promise to be resolved')
    console.log(result)
})