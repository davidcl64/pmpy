'use strict';
const push  = require('./consul_commands/push');
const pull  = require('./consul_commands/pull');

const buildArgs = (yargs) => {
  return yargs
    .options(
      { 'prefix': {
          describe: 'prefix for key/value pairs in consul',
          default:  'pmpy',
          nargs:    1,
          global:   true,
          type:     'string' },

        'path': {
          describe: 'path to the key/value pairs in consul',
          alias:    'p',
          default:  '',
          nargs:    1,
          global:   true,
          type:     'string' },
                    
        'format': {
          describe: 'data format [json|env]',
          alias:    'f',
          default:  'json',
          choices:  ['json','env'],
          nargs:    1,
          global:   true,
          type:     'string' },          
      })
    .command(push)
    .command(pull);
};

module.exports = exports = {
  command:  "consul <action>",
  describe: "Manage data in consul",
  builder:  buildArgs,
  handler:  function() {}
};