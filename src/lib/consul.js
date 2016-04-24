'use strict';
const rx          = require('rx');
const consulInit  = require('consul');
const util        = require('./util');
const _           = require('lodash/fp');
const tryParse    = util.tryParse;

const rmPrefix    = (prefix, val) => val.replace(new RegExp(`^(${prefix})`), '');
const unPrefix    = (record) => Object.assign({}, record, {Key: rmPrefix(record.__prefix, record.Key)});
const parseValue  = (record) => Object.assign({}, record, {Value: tryParse(record.Value)});
const consulToKV  = (record) => ({key: record.Key, value: record.Value});
const flattenKV   = (accum, record) => { accum[record.key] = record.value; return accum; };
const throwOnErr  = (err) => { if(err) { throw err; } };
const obsFromArg0 = (arg) => rx.Observable.from(arg);

const kvSet       = (consul) => (kv)   => consul.kv.set(kv, throwOnErr);
const kvGet       = (consul) => (opts) => rx.Observable.create((observer) => {
  consul.kv.get(opts, function(err, result) {
    if(err) { observer.onError(err); }
    else if(result && result.length) { 
      observer.onNext(_.map(_.merge({__prefix: opts.key}))(result)); 
    }
    observer.onCompleted();
  });
});

const pull        = (consul) => (key)  => kvGet(consul)({key: key, recurse: true});
const fullPath    = (prefix) => (path) => `${prefix}${path||''}`.replace(/\/?$/, '/');

const init = (opts) => {
  opts = opts || {};
  
  const consul    = consulInit(opts);
  const prefix    = (opts.prefix || 'pmpy').replace(/\/?$/, '/'); // ensure a trailing slash
  const kvSetOpts = (path)  => (kv) => ({key: `${fullPath(prefix)(path)}${kv.key}`, value: JSON.stringify(kv.value)});
  
  return {
    pull: (path) => {
      return rx.Observable.from(_.flatten([path]))  // Ensure an array of paths
        .map(fullPath(prefix))                      // get the full path (prefix/path)
        .concatMap(pull(consul))                    // Grab values from consul - maintain order!
        .concatMap(obsFromArg0)                     // Convert to observable sequences - maintain order!
        .map(unPrefix)                              // Remove (prefix/path) from the keys
        .map(parseValue)                            // Allows us to get real Javascript types (oxymoron?)
        .map(consulToKV)                            // Pluck the key/value pairs
        .reduce(flattenKV, {})                      // Reduce to a single object with keys and values
        .map(util.unflatten);                       // Expand the object to its full hierarchy
    },

    push: (path, data) => {
      return rx.Observable.just(data)               // Start with a simple Object
        .flatMap(util.kvMap)                        // Flatten to key/value pairs
        .map(kvSetOpts(path))                       // Get consul opts => {key: prefix/path/key, value: val }
        .do(kvSet(consul));                         // Fire off a set to consul 
    }
  };
};

module.exports = exports = init;
