'use strict';

var rx = require('rx');
var consulInit = require('consul');
var util = require('./util');
var _ = require('lodash/fp');
var tryParse = util.tryParse;

var rmPrefix = function rmPrefix(prefix, val) {
  return val.replace(new RegExp('^(' + prefix + ')'), '');
};
var unPrefix = function unPrefix(record) {
  return Object.assign({}, record, { Key: rmPrefix(record.__prefix, record.Key) });
};
var parseValue = function parseValue(record) {
  return Object.assign({}, record, { Value: tryParse(record.Value) });
};
var consulToKV = function consulToKV(record) {
  return { key: record.Key, value: record.Value };
};
var flattenKV = function flattenKV(accum, record) {
  accum[record.key] = record.value;return accum;
};
var obsFromArg0 = function obsFromArg0(arg) {
  return rx.Observable.from(arg);
};

var kvSet = function kvSet(consul) {
  return function (opts) {
    return rx.Observable.create(function (observer) {
      consul.kv.set(opts, function (err) {
        if (err) {
          return observer.onError(err);
        }

        observer.onNext(Object.assign({}, opts, { value: tryParse(opts.value) }));
        observer.onCompleted();
      });
    });
  };
};

var kvGet = function kvGet(consul) {
  return function (opts) {
    return rx.Observable.create(function (observer) {
      consul.kv.get(opts, function (err, result) {
        if (err) {
          return observer.onError(err);
        }
        if (result && result.length) {
          observer.onNext(_.map(_.merge({ __prefix: opts.key }))(result));
        }
        observer.onCompleted();
      });
    });
  };
};

var _pull = function _pull(consul) {
  return function (key) {
    return kvGet(consul)({ key: key, recurse: true });
  };
};
var fullPath = function fullPath(prefix) {
  return function (path) {
    return ('' + prefix + (path || '')).replace(/\/?$/, '/');
  };
};

var init = function init(opts) {
  opts = opts || {};

  var tokenOpt = opts['consul-token'] ? { token: opts['consul-token'] } : {};
  var consul = consulInit(Object.assign({}, opts, tokenOpt));
  var prefix = (opts.prefix || 'pmpy').replace(/\/?$/, '/'); // ensure a trailing slash
  var kvSetOpts = function kvSetOpts(path) {
    return function (kv) {
      return { key: '' + fullPath(prefix)(path) + kv.key, value: JSON.stringify(kv.value) };
    };
  };

  return {
    _: { // Private stuff exposed for unit tests
      client: consul,
      prefix: prefix,
      kvSetOpts: kvSetOpts
    },

    pull: function pull(path) {
      return rx.Observable.from(_.flatten([path])) // Ensure an array of paths
      .map(fullPath(prefix)) // Get the full path (prefix/path)
      .concatMap(_pull(consul)) // Grab values from consul - maintain order!
      .concatMap(obsFromArg0) // Convert to observable sequences - maintain order!
      .map(unPrefix) // Remove (prefix/path) from the keys
      .map(parseValue) // Allows us to get real Javascript types (oxymoron?)
      .map(consulToKV) // Pluck the key/value pairs
      .reduce(flattenKV, {}) // Reduce to a single object with keys and values
      .map(util.unflatten);
    }, // Expand the object to its full hierarchy

    push: function push(path, data) {
      return rx.Observable.just(data) // Start with a simple Object
      .flatMap(util.kvMap) // Flatten to key/value pairs
      .map(kvSetOpts(path)) // Get consul opts => {key: prefix/path/key, value: val }
      .flatMap(kvSet(consul));
    } // Fire off a set to consul
  };
};

module.exports = exports = init;

// Not part of the public API - exposing for unit tests
module.exports._ = {
  rmPrefix: rmPrefix,
  unPrefix: unPrefix,
  parseValue: parseValue,
  consulToKV: consulToKV,
  flattenKV: flattenKV,
  obsFromArg0: obsFromArg0,
  kvSet: kvSet,
  kvGet: kvGet,
  pull: _pull,
  fullPath: fullPath
};
