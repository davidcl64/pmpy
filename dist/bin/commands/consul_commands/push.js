'use strict';

var consul = require('../../../lib/consul');
var util = require('../../../lib/util');

var _handler = function _handler(yargs) {
  return util[yargs.format].read(yargs.value).flatMap(consul(util.yargs.consulOpts(yargs)).push.bind(null, yargs.path));
};

module.exports = exports = {
  command: 'push',
  describe: 'Write data to consul',
  builder: function builder(yargs) {
    return yargs.option('value', {
      describe: 'JSON document of values to be imported\n- accept input from stdin\n@ accept input from a file',
      demand: 1,
      nargs: 1,
      type: 'string'
    });
  },

  __handler: _handler,
  handler: function handler(yargs) {
    return _handler(yargs).subscribe(function (data) {
      return util.log('key: %s, value: %s', data.key, data.value);
    }, function (err) {
      return util.logErrAndQuit(err.stack);
    }, process.exit);
  }
};
