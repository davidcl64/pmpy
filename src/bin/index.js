#!/usr/bin/env node

'use strict';
const path        = require('path');
const yargs       = require('yargs');
const requireAll  = require('require-all');

const commands    = requireAll(path.join(__dirname, 'commands'));

const argv = yargs
  .command(commands.playground)
  .command(commands.consul)
  .help()
  .argv;


if(!argv._.length) { yargs.showHelp(); }
