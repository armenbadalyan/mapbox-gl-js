# Web Worker Notes

Some operations are done in Web Worker threads.

For example, processing vector tiles is done in src/source/vector_tile_worker_source.js

The map constructor creates a Style object which in turn creates a Dispatcher object which in turn 
creates a web worker for the style. The actual web worker instance is created in 

Map::constructor => src/ui/map.js
    Style::constructor => src/style/style.js
        getWorkerPool() => src/util/global_worker_pool.js
            WorkerPool::acquire() => src/util/worker_pool.js
                WebWorker::constructor() => src/util/web_worker.js
                    Worker::constructor() => src/source/worker.js
        Dispatcher => src/util/dispatcher.js

src/util/worker_pool.js uses this contruct where it implicitly "requires" src/index.js to get the workerCount browser setting.

## src/util/browser/web_worker.js

src/util/browser/web_worker.js for the location where the actual web worker thread is created. 

	const workerURL = window.URL.createObjectURL(new WebWorkify(require('../../source/worker'), {bare: true})); 

It relies on the WebWorkify module which allows it to 'require' a local file for use in the web worker instead of forcing
it to make an HTTP request.

The directory src/util/browser is included via require. 

Messages are sent back and forth between the main thread and the worker threads. 

actor.js contains the send/receive interface to talk to web workers. If sent a method name, it invokes the method in the worker source.

Instances of Actor are present in both the main thread and the worker threads.

The getGlyphs and getIcons methods appear to be in style.js in the main thread.

## Git Notes

To merge remote github repository into a local branch just pull the remote repository and branch.

e.g.

git checkout localbranch
git pull https://github.com/mapbox/mapbox-gl-js.git 4740-per-map-transform
