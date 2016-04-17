'use strict';
const push  = require('./consul_commands/push');
const pull  = require('./consul_commands/pull');

const buildArgs = (yargs) => {
  return yargs
    .options({'prefix': {
      describe: 'prefix for key/value pairs in consul',
      alias:    'p',
      default:  'pmpy',
      nargs:    1,
      global:   true,
      type:     'string'
    }})
    .command(push)
    .command(pull);
};

module.exports = exports = {
  command:  "consul <action>",
  describe: "Manage data in consul",
  builder:  buildArgs,
  handler:  function() {}
};