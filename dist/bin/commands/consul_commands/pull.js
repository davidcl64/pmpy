'use strict';

var consul = require('../../../lib/consul');
var util = require('../../../lib/util');

module.exports = exports = {
  command: 'pull',
  describe: 'Read data from consul',
  builder: function builder(yargs) {
    return yargs;
  },
  handler: function handler(yargs) {
    consul({ prefix: yargs.prefix }).pull(yargs.path).subscribe(function (conf) {
      return util[yargs.format].print(conf);
    }, function (err) {
      return console.log(err.stack);
    });
  }
};
