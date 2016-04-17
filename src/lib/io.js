'use strict';

const fs      = require('fs');
const stream  = require('stream');
const RxNode  = require('rx-node');

const streamFromString = (val) => {
  let s = new stream.Readable();
  s._read = () => { s.push(val); s.push(null); };
  return s;
};

const inStreams = {
  '-':      ()      => process.stdin,
  '@':      (path)  => fs.createReadStream(path.slice(1)),
  default:  (val)   => streamFromString(val),
  
  get:      (loc)   => (inStreams[(loc || "").slice(0,1)] || inStreams.default)(loc || "")
};

const read      = (loc) => RxNode.fromStream(inStreams.get(loc), 'end');

module.exports  = exports = {
  inStreams:  inStreams,
  read:       read
};
