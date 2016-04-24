'use strict';

var consul = require('../../../lib/consul');
var util = require('../../../lib/util');

module.exports = exports = {
  command: 'push',
  describe: 'Write data to consul',
  builder: function builder(yargs) {
    yargs.option('value', {
      describe: 'JSON document of values to be imported\n- accept input from stdin\n@ accept input from a file',
      demand: 1,
      nargs: 1,
      type: 'string'
    });

    return yargs;
  },
  handler: function handler(yargs) {
    util[yargs.format].read(yargs.value).flatMap(consul({ prefix: yargs.prefix }).push.bind(null, yargs.path)).subscribe(function (data) {
      return console.log('key: %s, value: %s', data.key, data.value);
    }, function (err) {
      return console.log(err.stack);
    }, function () {
      return console.log('Done!');
    });
  }
};
