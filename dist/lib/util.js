'use strict';

var rx = require('rx');
var flat = require('flat');
var io = require('./io');
var read = io.read;
var rxJust = rx.Observable.just;
var rxPairs = rx.Observable.pairs;
var dotenv = require('dotenv');
var _ = require('lodash/fp');

var noop = function noop() {};
var jsonParse = function jsonParse(doc) {
  return JSON.parse(doc);
};
var readJSON = function readJSON(loc) {
  return read(loc).map(jsonParse);
};
var toKV = function toKV(kv) {
  return { key: kv[0], value: kv[1] };
};
var flatten = function flatten(doc) {
  return flat(doc, { delimiter: '/' });
};
var unflatten = function unflatten(doc) {
  return flat.unflatten(doc, { delimiter: '/' });
};
var kvMap = function kvMap(doc) {
  return rxJust(doc).map(flatten).flatMap(rxPairs).map(toKV);
};

var tryParse = function tryParse(value) {
  try {
    value = JSON.parse(value);
  } catch (e) {/*ignore*/}
  return value;
};

var envFlatten = function envFlatten(doc) {
  return flat(doc, { delimiter: '__' });
};
var envUnflatten = function envUnflatten(doc) {
  return flat.unflatten(doc, { delimiter: '__' });
};
var envParseValue = _.mapValues(tryParse);
var envParse = function envParse(doc) {
  return dotenv.parse(doc);
};
var readEnv = function readEnv(loc) {
  return read(loc).map(envParse).map(envParseValue).map(envUnflatten);
};

var log = function _log() {
  console.log.apply(console, arguments);
};

var logErrAndQuit = function _logErrAndQuit() {
  console.error.apply(console, arguments);
  process.exit(1);
};

module.exports = exports = {
  _: {
    toKV: toKV
  },

  yargs: {
    consulOpts: _.flow(_.pick(['prefix', 'host', 'port', 'secure', 'consul-token']), _.omitBy(_.isUndefined))
  },

  json: {
    read: readJSON,
    parse: jsonParse,
    print: function print(doc) {
      return console.log(JSON.stringify(doc, null, 2));
    }
  },

  env: {
    read: readEnv,
    parse: envParse,
    print: _.flow(envFlatten, _.toPairs, _.map(function (kv) {
      return console.log("export %s='%s'", kv[0], JSON.stringify(kv[1]));
    }))
  },

  noop: noop,
  tryParse: tryParse,
  flatten: flatten,
  unflatten: unflatten,
  kvMap: kvMap,
  log: log,
  logErrAndQuit: logErrAndQuit
};
