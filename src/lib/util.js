'use strict';
const rx        = require('rx');
const flat      = require('flat');
const io        = require('./io');
const read      = io.read;
const rxJust    = rx.Observable.just;
const rxPairs   = rx.Observable.pairs;

const jsonParse = (doc) => JSON.parse(doc);
const readJSON  = (loc) => read(loc).map(jsonParse);
const toKV      = (kv)  => ({key: kv[0], value: kv[1]});
const flatten   = (doc) => flat(doc, {delimiter: '/'});
const unflatten = (doc) => flat.unflatten(doc, {delimiter: '/'});
const kvMap     = (doc) => rxJust(doc).map(flatten).flatMap(rxPairs).map(toKV);

module.exports = exports = {
  _: {
    toKV: toKV
  },
  
  json: {
    read:   readJSON,
    parse:  jsonParse    
  },
  
  env: {
      
  },
  
  flatten:    flatten,
  unflatten:  unflatten,
  kvMap:      kvMap
};