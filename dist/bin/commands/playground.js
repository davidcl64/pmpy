'use strict';

var pg = require('../../lib/playground');
var builderNoOp = function builderNoOp(yargs) {
  return yargs;
};

var commands = [{ command: 'start',
  describe: 'Start playground services',
  builder: builderNoOp,
  handler: pg.start.bind(null, function (err) {
    return err ? pg.env() : true;
  }) }, { command: 'stop',
  describe: 'Stop playground services',
  builder: builderNoOp,
  handler: pg.stop }, { command: 'restart',
  describe: 'Restart playground services',
  builder: builderNoOp,
  handler: pg.restart }, { command: 'reset',
  describe: 'Resets consul & vault without a full restart',
  builder: builderNoOp,
  handler: pg.reset }, { command: 'env',
  describe: 'Display vault keys',
  builder: builderNoOp,
  handler: pg.env }];

module.exports = exports = {
  command: "playground <action>",
  describe: "Control the docker based playground for consul+vault",
  builder: function builder(yargs) {
    commands.forEach(yargs.command.bind(yargs));return yargs;
  },
  handler: function handler() {}
};
