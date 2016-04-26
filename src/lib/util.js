'use strict';
const rx            = require('rx');
const flat          = require('flat');
const io            = require('./io');
const read          = io.read;
const rxJust        = rx.Observable.just;
const rxPairs       = rx.Observable.pairs;
const dotenv        = require('dotenv');
const _             = require('lodash/fp');
const debug         = require('debug')('pmpy');

const trace         = (label)  => (val) => debug('%s: %j', label, val);

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

module.exports = exports = {
  _: {
    toKV: toKV
  },
  
  yargs: {
    consulOpts: _.pick(['prefix', 'host', 'port', 'secure'])
  },
  
  json: {
    read:   readJSON,
    parse:  jsonParse,
    print:  (doc) => console.log(JSON.stringify(doc,null,2))  
  },
  
  env: {
    read:   readEnv,
    parse:  envParse,
    print:  _.flow(envFlatten, _.toPairs, _.map((kv) => console.log("EXPORT %s='%s'", kv[0], JSON.stringify(kv[1]))))
  },
  
  trace:      trace,
  tryParse:   tryParse,
  flatten:    flatten,
  unflatten:  unflatten,
  kvMap:      kvMap
};