'use strict';
const rx            = require('rx');
const flat          = require('flat');
const io            = require('./io');
const read          = io.read;
const rxJust        = rx.Observable.just;
const rxPairs       = rx.Observable.pairs;
const dotenv        = require('dotenv');
const _             = require('lodash/fp');

const noop          = ()    => {};
const jsonParse     = (doc) => JSON.parse(doc);
const readJSON      = (loc) => read(loc).map(jsonParse);
const toKV          = (kv)  => ({key: kv[0], value: kv[1]});
const flatten       = (doc) => flat(doc, {delimiter: '/'});
const unflatten     = (doc) => flat.unflatten(doc, {delimiter: '/'});
const kvMap         = (doc) => rxJust(doc).map(flatten).flatMap(rxPairs).map(toKV);

const tryParse      = (value)  => {
  try { value = JSON.parse(value); }
  catch(e) { /*ignore*/ }
  return value;
};

const envFlatten    = (doc) => flat(doc, {delimiter: '__'});
const envUnflatten  = (doc) => flat.unflatten(doc, {delimiter: '__'});
const envParseValue = _.mapValues(tryParse);
const envParse      = (doc) => dotenv.parse(doc);
const readEnv       = (loc) => read(loc).map(envParse).map(envParseValue).map(envUnflatten);

const log           = function _log() {
  console.log.apply(console, arguments);
};

const logErrAndQuit = function _logErrAndQuit() {
  console.error.apply(console, arguments);
  process.exit(1);
};


module.exports = exports = {
  _: {
    toKV: toKV
  },
  
  yargs: {
    consulOpts: _.flow(
        _.pick(['prefix', 'host', 'port', 'secure', 'consul-token']),
        _.omitBy(_.isUndefined)
      )
  },
  
  json: {
    read:   readJSON,
    parse:  jsonParse,
    print:  (doc) => console.log(JSON.stringify(doc,null,2))  
  },
  
  env: {
    read:   readEnv,
    parse:  envParse,
    print:  _.flow(envFlatten, _.toPairs, _.map((kv) => console.log("export %s='%s'", kv[0], JSON.stringify(kv[1]))))
  },
  
  noop:           noop,
  tryParse:       tryParse,
  flatten:        flatten,
  unflatten:      unflatten,
  kvMap:          kvMap,
  log:            log,
  logErrAndQuit:  logErrAndQuit
};