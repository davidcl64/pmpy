'use strict';
const consul  = require('../../../lib/consul');
const util    = require('../../../lib/util');

const handler = (yargs) => consul(util.yargs.consulOpts(yargs)).pull(yargs.path);

module.exports = exports = {
  command:    'pull',
  describe:   'Read data from consul',
  builder:    (yargs) => yargs,
  __handler:  handler,
  handler:    (yargs) => 
    handler(yargs).subscribe(
      (conf) => util[yargs.format].print(conf),
      (err)  => util.logErrAndQuit(err.stack),
      process.exit
    )
};