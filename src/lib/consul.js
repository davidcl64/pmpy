'use strict';
const rx          = require('rx');
const consulInit  = require('consul');
const util        = require('./util');

const parseValue  = (record) => Object.assign({}, record, {Value: JSON.parse(record.Value)});
const consulToKV  = (prefix) => (record) => ({key: record.Key.replace(prefix, ''), value: record.Value});
const flattenKV   = (accum, record) => { accum[record.key] = record.value; return accum; };


function init(opts) {
  opts = opts || {};
  
  const consul  = consulInit(opts);
  const kvGet   = rx.Observable.fromNodeCallback(consul.kv.get, consul.kv, (result) => result || []);
  const prefix  = (opts.prefix || 'pmpy').replace(/\/?$/, '/'); // ensure a trailing slash
  
  return {
    pull: (path) => {
      return kvGet({key: prefix + path, recurse: true})
        .flatMap(rx.Observable.from)
        .map(parseValue)
        .map(consulToKV(prefix))
        .reduce(flattenKV, {})
        .map(util.unflatten);
    },

    push: (data) => {
      return rx.Observable.just(data)
        .flatMap(util.kvMap)
        .map((kv) => ({key: prefix + kv.key, value: JSON.stringify(kv.value)}))
        .do((kv) => consul.kv.set(kv, (err) => { if(err) { throw err; } }));
    }
  };
}

module.exports = exports = init;
