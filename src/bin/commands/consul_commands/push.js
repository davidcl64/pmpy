'use strict';
const consul  = require('../../../lib/consul');
const util    = require('../../../lib/util');

const handler = (yargs) => 
  util[yargs.format]
    .read(yargs.value)
    .flatMap(consul(util.yargs.consulOpts(yargs)).push.bind(null, yargs.path));

module.exports = exports = {
  command:    'push',
  describe:   'Write data to consul',
  builder:    (yargs) => {
    return yargs
      .option('value', {
        describe: 'JSON document of values to be imported\n- accept input from stdin\n@ accept input from a file',
        demand: 1,
        nargs: 1,
        type: 'string'
      });
  },
  
  __handler:  handler,
  handler:    (yargs) => handler(yargs)
    .subscribe(
      (data) => util.log('key: %s, value: %s', data.key, data.value),
      (err)  => util.logErrAndQuit(err.stack),
      process.exit
    )
};