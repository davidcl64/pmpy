'use strict';
const consul      = require('../../../lib/consul');
const util        = require('../../../lib/util');


module.exports = exports = {
  command:  'push',
  describe: 'Write data to consul',
  builder:  function(yargs) {
    yargs
      .option('value', {
        describe: 'JSON document of values to be imported\n- accept input from stdin\n@ accept input from a file',
        demand: 1,
        nargs: 1,
        type: 'string'
      });

    return yargs;
  },
  handler:  (yargs) => {
    util.json.read(yargs.value)
      .flatMap(consul({prefix: yargs.prefix}).push)
      .subscribe(
        (data) => console.dir(data),
        (err)  => console.log(err.stack)
      );
  }
};