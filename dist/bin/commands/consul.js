'use strict';

var push = require('./consul_commands/push');
var pull = require('./consul_commands/pull');

var buildArgs = function buildArgs(yargs) {
  return yargs.options({ 'prefix': {
      describe: 'prefix for key/value pairs in consul',
      default: 'pmpy',
      nargs: 1,
      global: true,
      type: 'string' },

    'path': {
      describe: 'path to the key/value pairs in consul',
      alias: 'p',
      default: '',
      nargs: 1,
      global: true,
      type: 'string' },

    'format': {
      describe: 'data format [json|env]',
      alias: 'f',
      default: 'json',
      choices: ['json', 'env'],
      nargs: 1,
      global: true,
      type: 'string' },

    'host': {
      describe: 'host name/address',
      default: '127.0.0.1',
      nargs: 1,
      global: true,
      type: 'string' },

    'port': {
      describe: 'consul HTTP(S) port',
      default: 8500,
      nargs: 1,
      global: true,
      type: 'number' },

    'secure': {
      describe: 'enable HTTPS',
      default: false,
      nargs: 1,
      global: true,
      type: 'boolean' },

    'consul-token': {
      describe: 'ACL token',
      nargs: 1,
      global: true,
      type: 'string' }
  }).command(push).command(pull);
};

module.exports = exports = {
  command: "consul <action>",
  describe: "Manage data in consul",
  builder: buildArgs,
  handler: function handler() {}
};
