const libQ = require('kew');

function jsPromiseToKew(promise) {
  let defer = libQ.defer();

  promise.then(result => {
    defer.resolve(result);
  })
    .catch(error => {
      defer.reject(error);
    });

  return defer.promise;
}

module.exports = {
  jsPromiseToKew
};
