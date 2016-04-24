'use strict';

var fs = require('fs');
var stream = require('stream');
var RxNode = require('rx-node');

var streamFromString = function streamFromString(val) {
  var s = new stream.Readable();
  s._read = function () {
    s.push(val);s.push(null);
  };
  return s;
};

var inStreams = {
  '-': function _() {
    return process.stdin;
  },
  '@': function _(path) {
    return fs.createReadStream(path.slice(1));
  },
  default: function _default(val) {
    return streamFromString(val);
  },

  get: function get(loc) {
    return (inStreams[(loc || "").slice(0, 1)] || inStreams.default)(loc || "");
  }
};

var read = function read(loc) {
  return RxNode.fromStream(inStreams.get(loc), 'end');
};

module.exports = exports = {
  inStreams: inStreams,
  read: read
};
