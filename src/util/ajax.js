// @flow

const window = require('./window');

/**
 * The type of a resource.
 */
// type ResourceType = "Unknown" | "Style" | "Source" | "Tile" | "Glyphs" | "SpriteImage" | "SpriteJSON" | "Image";
const ResourceType = {
    Unknown: Symbol('Unknown'),
    Style: Symbol('Style'),
    Source: Symbol('Source'),
    Tile: Symbol('Tile'),
    Glyphs: Symbol('Glyphs'),
    SpriteImage: Symbol('SpriteImage'),
    SpriteJSON: Symbol('SpriteJSON'),
    Image: Symbol('Image')
};

if (typeof Object.freeze == 'function') {
    Object.freeze(ResourceType);
}

/**
 * A `RequestParameters` object to be returned from Map.options.transformRequest callbacks
 * @typedef {Object} RequestParameters
 * @property {string} url The URL to be requested
 * @property {Object} headers The headers to be sent with the request
 */
export type RequestParameters = {
    url: string,
    // resourceType?: ResourceType,
    headers?: Object
};

class AJAXError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

function makeRequest(requestParameters: RequestParameters) : XMLHttpRequest {
    const xhr: XMLHttpRequest = new window.XMLHttpRequest();

    xhr.open('GET', requestParameters.url, true);
    for (const k in requestParameters.headers) {
        xhr.setRequestHeader(k, requestParameters.headers[k]);
    }
    return xhr;
}

exports.getJSON = function(requestParameters: RequestParameters, callback: Callback<mixed>) {
    const xhr = makeRequest(requestParameters);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onerror = function() {
        callback(new Error(xhr.statusText));
    };
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            let data;
            try {
                data = JSON.parse(xhr.response);
            } catch (err) {
                return callback(err);
            }
            callback(null, data);
        } else {
            callback(new AJAXError(xhr.statusText, xhr.status));
        }
    };
    xhr.send();
    return xhr;
};

exports.getArrayBuffer = function(requestParameters: RequestParameters, callback: Callback<{data: ArrayBuffer, cacheControl: ?string, expires: ?string}>) {
    const xhr = makeRequest(requestParameters);
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function() {
        callback(new Error(xhr.statusText));
    };
    xhr.onload = function() {
        const response: ArrayBuffer = xhr.response;
        if (response.byteLength === 0 && xhr.status === 200) {
            return callback(new Error('http status 200 returned without content.'));
        }
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            callback(null, {
                data: response,
                cacheControl: xhr.getResponseHeader('Cache-Control'),
                expires: xhr.getResponseHeader('Expires')
            });
        } else {
            callback(new AJAXError(xhr.statusText, xhr.status));
        }
    };
    xhr.send();
    return xhr;
};

function sameOrigin(url) {
    const a: HTMLAnchorElement = window.document.createElement('a');
    a.href = url;
    return a.protocol === window.document.location.protocol && a.host === window.document.location.host;
}

const transparentPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

exports.getImage = function(requestParameters: RequestParameters, callback: Callback<HTMLImageElement>) {
    // request the image with XHR to work around caching issues
    // see https://github.com/mapbox/mapbox-gl-js/issues/1470
    return exports.getArrayBuffer(requestParameters, (err, imgData) => {
        if (err) {
            callback(err);
        } else if (imgData) {
            const img: HTMLImageElement = new window.Image();
            const URL = window.URL || window.webkitURL;
            img.onload = () => {
                callback(null, img);
                URL.revokeObjectURL(img.src);
            };
            const blob: Blob = new window.Blob([new Uint8Array(imgData.data)], { type: 'image/png' });
            (img : any).cacheControl = imgData.cacheControl;
            (img : any).expires = imgData.expires;
            img.src = imgData.data.byteLength ? URL.createObjectURL(blob) : transparentPngUrl;
        }
    });
};

exports.getVideo = function(urls: Array<string>, callback: Callback<HTMLVideoElement>) {
    const video: HTMLVideoElement = window.document.createElement('video');
    video.onloadstart = function() {
        callback(null, video);
    };
    for (let i = 0; i < urls.length; i++) {
        const s: HTMLSourceElement = window.document.createElement('source');
        if (!sameOrigin(urls[i])) {
            video.crossOrigin = 'Anonymous';
        }
        s.src = urls[i];
        video.appendChild(s);
    }
    return video;
};
