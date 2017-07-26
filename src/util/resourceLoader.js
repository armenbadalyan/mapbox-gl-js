// @flow

const ajax = require('../util/ajax');
const window = require('./window');

/*
FIXME: I don't understand why this doesn't work.

import type { ResourceType } from '../util/ajax';
import type { RequestParameters } from '../util/ajax';
import type { AJAXError } from '../util/ajax';
*/


const ResourceType = {
    Unknown: 'Unknown',
    Style: 'Style',
    Source: 'Source',
    Tile: 'Tile',
    Glyphs: 'Glyphs',
    SpriteImage: 'SpriteImage',
    SpriteJSON: 'SpriteJSON',
    Image: 'Image'
};

exports.ResourceType = ResourceType;

export type RequestParameters = {
    url: string,
    headers?: Object,
    withCredentials? : Boolean
};

class AJAXError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/**
* resource loader
*
* This supports routing resource requests for non-http sources through a 
* caller provided resource loader.
*/

/**
* determine if a URL is a local url.
*
* @todo need to sync this up with the new transformRequests
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
* The request parameters are transformed in the main thread when the
* map is created.
*
* @see Map#setRequestTransform
*
* @param {RequestParameters} url to request along with extra headers.
* @param {Callback} callback
* @param {Actor} actor 
*.
* @return {XMLHttpRequest|MockXMLHttpRequest}
*/

exports.getJSON = function( requestParameters: RequestParameters, callback: Callback<mixed>, actor ) {

    console.log( "resourceLoader::getJSON() - top with requestParameters:", requestParameters );

    if ( isLocalURL( requestParameters.url ) ) {

        // FIXME: ugly. What is a better way to determine whether or not we're in a Web Worker?

        if ( typeof document == 'undefined' ) {

            console.log( "resourceLoader(): getJSON():  we are in a web worker." );

            if ( ! actor ) {
                callback( new AJAXError( 'Internal Error - no actor', 404 ));
            }

            actor.send( 'loadResource', { method: 'getJSON', requestParameters: requestParameters }, ( err, response ) => {

                console.log( "resourceLoader(): got response:", err, response );

                if (err) { callback( new AJAXError( 'unable to load local json', 404 )); }

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

            console.log( "resourceLoader(): getJSON():  we are in a the main thread with requestParamters and window:", requestParameters, window );

            if ( typeof window.localResourceLoader == 'undefined' ) {

                console.log( "resourceLoader(): no localResourceLoader defined" );

                callback( new AJAXError( "no caller provided resourceLoader for non-http resources", 404 ));
            }

            return window.localResourceLoader.getJSON( requestParameters, callback );

        }

    }

    console.log( "resourceLoader(): we have a normal remote URL" );

    return ajax.getJSON( requestParameters, callback );

};

/**
* request an array buffer
*
* @param {RequestParameters} url to request along with extra headers.
* @param {Callback} callback
* @param {Actor} actor 
*
* @return {XMLHttpRequest|MockXMLHttpRequest}
*
* @see style.js loadResource
*/

exports.getArrayBuffer = function( requestParameters: RequestParameters, callback: Callback<{data: ArrayBuffer, cacheControl: ?string, expires: ?string}>, actor ) {

    console.log( "resourceLoader::getArrayBuffer() - top" );

    if ( isLocalURL( requestParameters.url ) ) {

        if ( typeof document == 'undefined' ) {

            console.log( "resourceLoader(): getArrayBuffer():  we are in a web worker." );

            if ( ! actor ) {
                callback( new AJAXError( 'Internal Error - no actor', 404 ));
            }

            actor.send( 'loadResource', { method: 'getArrayBuffer', requestParameters: requestParameters }, ( err, response ) => {

                console.log( "resourceLoader::getArrayBuffer got response:", err, response );

                if (err) { callback( new AJAXError( 'unable to load array buffer', 404 )); }

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
                callback( new AJAXError( "unimplemented", 404 ));
            }

            return window.localResourceLoader.getArrayBuffer( requestParameters, callback );

        }

    }

    console.log( "resourceLoader(): we have a normal remote URL" );

    return ajax.getArrayBuffer( requestParameters, callback );

};

/**
* load an image from a remote location
*/

exports.getImage = function(requestParameters: RequestParameters, callback: Callback<HTMLImageElement>) {
    console.log( "resourceLoader::getImage() - top" );
    return ajax.getImage( requestParameters, callback );
};


/**
* get a video
*
* This returns an element and cannot be called from a worker thread.
*
* @return {HTMLElement}
*/

exports.getVideo = function( urls: Array<string>, callback: Callback<HTMLVideoElement> ) {
    return ajax.getVideo( urls, callback );
};

// END
