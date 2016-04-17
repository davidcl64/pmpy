'use strict';
const rx          = require('rx');
const consulInit  = require('consul');
const util        = require('./util');

const rmPrefix    = (prefix, val) => val.replace(new RegExp(`^(${prefix})`), '');
const unPrefix    = (prefix) => (record) => Object.assign({}, record, {Key: rmPrefix(prefix, record.Key)});
const parseValue  = (record) => Object.assign({}, record, {Value: JSON.parse(record.Value)});
const consulToKV  = (record) => ({key: record.Key, value: record.Value});
const flattenKV   = (accum, record) => { accum[record.key] = record.value; return accum; };
const throwOnErr  = (err) => { if(err) { throw err; } };

function init(opts) {
  opts = opts || {};
  
  const consul  = consulInit(opts);
  const kvGet   = rx.Observable.fromNodeCallback(consul.kv.get, consul.kv, (result) => result || []);
  const prefix  = (opts.prefix || 'pmpy').replace(/\/?$/, '/'); // ensure a trailing slash
  const kvSet   = (kv) => consul.kv.set(kv, throwOnErr);
  
  return {
    pull: (path) => {
      return kvGet({key: `${prefix}${path}`, recurse: true})
        .flatMap(rx.Observable.from)
        .map(unPrefix(prefix))
        .map(parseValue)
        .map(consulToKV)
        .reduce(flattenKV, {})
        .map(util.unflatten);
    },

    push: (data) => {
      return rx.Observable.just(data)
        .flatMap(util.kvMap)
        .map((kv) => ({key: `${prefix}${kv.key}`, value: JSON.stringify(kv.value)}))
        .do(kvSet);
    }
  };
}

module.exports = exports = init;
