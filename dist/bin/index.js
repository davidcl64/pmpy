#!/usr/bin/env node


'use strict';

var path = require('path');
var yargs = require('yargs');
var requireAll = require('require-all');

var commands = requireAll(path.join(__dirname, 'commands'));

var argv = yargs.command(commands.playground).command(commands.consul).help().completion().argv;

if (!argv._.length) {
  yargs.showHelp();
}
