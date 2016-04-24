'use strict';
const consul  = require('../../../lib/consul');
const util    = require('../../../lib/util');

module.exports = exports = {
  command:  'pull',
  describe: 'Read data from consul',
  builder:  (yargs) => yargs,
  handler:  (yargs) => {
    consul({ prefix: yargs.prefix })
      .pull(yargs.path)
      .subscribe(
        (conf) => util[yargs.format].print(conf),
        (err)  => console.log(err.stack)
      );
  }
};