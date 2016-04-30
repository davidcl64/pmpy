'use strict';

var consul = require('../../../lib/consul');
var util = require('../../../lib/util');

var _handler = function _handler(yargs) {
  return consul(util.yargs.consulOpts(yargs)).pull(yargs.path);
};

module.exports = exports = {
  command: 'pull',
  describe: 'Read data from consul',
  builder: function builder(yargs) {
    return yargs;
  },
  __handler: _handler,
  handler: function handler(yargs) {
    return _handler(yargs).subscribe(function (conf) {
      return util[yargs.format].print(conf);
    }, function (err) {
      return util.logErrAndQuit(err.stack);
    }, process.exit);
  }
};
