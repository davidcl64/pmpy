'use strict';
const push  = require('./consul_commands/push');
const pull  = require('./consul_commands/pull');

module.exports = exports = {
  command:  "consul <action>",
  describe: "Manage data in consul",
  builder:  (yargs) => yargs.command(push).command(pull),
  handler:  function() {}
};