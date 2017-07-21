const util = require('../util/util');
const ajax = require('../util/ajax');
const browser = require('../util/browser');
const normalizeURL = require('../util/mapbox').normalizeSourceURL;

module.exports = function(options, requestTransformFn, callback) {
    if (!callback) {
        callback = requestTransformFn;
    }
    const loaded = function(err, tileJSON) {
        if (err) {
            return callback(err);
        }

        const result = util.pick(tileJSON, ['tiles', 'minzoom', 'maxzoom', 'attribution', 'mapbox_logo', 'bounds']);

        if (tileJSON.vector_layers) {
            result.vectorLayers = tileJSON.vector_layers;
            result.vectorLayerIds = result.vectorLayers.map((layer) => { return layer.id; });
        }

        callback(null, result);
    };

    if (options.url) {
        ajax.getJSON(requestTransformFn(normalizeURL(options.url)), loaded);
    } else {
        browser.frame(loaded.bind(null, null, options));
    }
};

