'use strict';

const ajax = require('../util/ajax');

/**
* resource loader
*
* This supports routing resource requests for non-http sources through a 
* caller provided resource loader.
*/

/**
* resource error
*/

class ResourceError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

/**
* determine if a URL is a local url.
*/

function isLocalURL( url ) {

    if (( url.indexOf( 'mapbox:' ) === 0 ) ||
        ( url.indexOf( 'http:' ) === 0 ) ||
        ( url.indexOf( 'https:' ) === 0 )) {
        return false;
    }

    return true;
}

/**
* load JSON either from a remote URL or local resource provider
*
* @param {string} url URL of resource.
* @return {XMLHttpRequest|MockXMLHttpRequest}
*/

exports.getJSON = function( url, callback ) {

    console.log( "resourceLoader::getJSON() - top" );

    if ( isLocalURL( url ) ) {

        // FIXME: ugly. What is a better way to determine whether or not we're in a Web Worker?

        if ( typeof document == 'undefined' ) {

            console.log( "resourceLoader(): getJSON():  we are in a web worker." );

            if ( ! actor ) {
                callback( new ResourceError( 'Internal Error - no actor', 404 ));
            }

            actor.send( 'loadResource', { method: 'getJSON', url: url}, ( err, response ) => {

                console.log( "resourceLoader(): got response:", err, response );

                if (err) { callback( new ResourceError( 'unable to load local json', 404 )); }

                try {
                    data = JSON.parse( response );
                } catch (err) {
                    return callback(err);
                }

                callback( null, data );

                // actor::send() does not return a value.
                //
                // The return value of getJSON does not seem to be used anywhere in the code.

                return { 
                    abort: function() {}
                };
            }); 

            return;

        } else {

            console.log( "resourceLoader(): getJSON():  we are in a the main thread." );

            if ( typeof window.localResourceLoader == 'undefined' ) {
                callback( new ResourceError( "no caller provided resourceLoader for non-http resources", 404 ));
            }

            return window.localResourceLoader.getJSON( url, callback );

        }

    }

    console.log( "resourceLoader(): we have a normal remote URL" );

    return ajax.getJSON( url, callback );

};

/**
* request an array buffer
*
* @return {XMLHttpRequest|MockXMLHttpRequest}
*
* @see style.js loadResource
*/

exports.getArrayBuffer = function(url, callback, actor ) {

    console.log( "resourceLoader::getArrayBuffer() - top" );

    if ( isLocalURL( url ) ) {

        if ( typeof document == 'undefined' ) {

            console.log( "resourceLoader(): getArrayBuffer():  we are in a web worker." );

            if ( ! actor ) {
                callback( new ResourceError( 'Internal Error - no actor', 404 ));
            }

            actor.send( 'loadResource', { method: 'getArrayBuffer', url: url }, ( err, response ) => {

                console.log( "resourceLoader::getArrayBuffer got response:", err, response );

                if (err) { callback( new ResourceError( 'unable to load array buffer', 404 )); }

                callback( null, {
                    data: response,
                    cacheControl: false,
                    expires: false
                });

            }); 

            // actor::send() does not return a value.
            //
            // Only the abort() method of xhr seems to be used anywhere. 
            // 
            // @see vector_tile_worker_source::loadVectorData() calls getArrayBuffer and returns a function 
            // about() wrapping xhr.abort.

            return { 
                abort: function() {}
            };

        } else {
            console.log( "resourceLoader(): getArrayBuf():  we are in a the main thread. Type of window.localResourceLoader is:", typeof window.localResourceLoader  );

            if ( typeof window.localResourceLoader == 'undefined' ) {
                callback( new ResourceError( "unimplemented", 404 ));
            }

            return window.localResourceLoader.getArrayBuffer( url, callback );

        }

    }

    console.log( "resourceLoader(): we have a normal remote URL" );

    return ajax.getArrayBuffer( url, callback );

};

/**
* load an image from a remote location
*/

exports.getImage = function(url, callback) {
    console.log( "resourceLoader::getImage() - top" );
    return ajax.getImage( url, callback );
};


/**
* get a video
*
* This returns an element and cannot be called from a worker thread.
*
* @return {HTMLElement}
*/

exports.getVideo = function(urls, callback) {
    return ajax.getVideo( urls, callback );
};
