
const WebWorkify = require('webworkify');
const window = require('../window');
const workerURL = window.URL.createObjectURL(new WebWorkify(require('../../source/worker'), {bare: true}));

module.exports = function () {

    console.log( "util/browser/web_worker(): creating a new worker using object URL:", workerURL );

    return new window.Worker(workerURL);
};
