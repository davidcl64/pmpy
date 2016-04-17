'use strict';
const consul      = require('../../../lib/consul');


module.exports = exports = {
  command:  'pull',
  describe: 'Read data from consul',
  builder:  (yargs) => yargs,
  handler:  (yargs) => {
    consul({ prefix: yargs.prefix })
      .pull('')
      .subscribe(
        (conf) => console.log(JSON.stringify(conf,null,2)),
        (err)  => console.log(err.stack)
      );
  }
};