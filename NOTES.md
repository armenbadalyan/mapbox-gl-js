2017-06-25

worker_tile.js parse sends a message via actor to the main thread with message 'getGlyphs' or 'getIcons'.

worker_tile is in the context of a web worker.

actor.js contains the send/receive interface to talk to web workers. If sent a method name, it invokes the method in the worker source.

actor.js is present in both the main thread and the worker threads.

The getGlyphs and getIcons methods appear to be in style.js in the main thread.
