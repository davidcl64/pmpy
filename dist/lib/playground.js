'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var async = require('async');
var consul = require('consul');
var vault = require('node-vault');

var logIfError = function logIfError(err) {
  if (err) {
    console.dir(err);
  }
};
var errorOnly = function errorOnly(done) {
  return function (err) {
    return done(err);
  };
};
var spawnOpts = { stdio: ['ignore', process.stdout, process.stderr] };
var scriptDir = path.join(__dirname, '..', '..', 'services');
var scriptPath = function scriptPath(script) {
  return path.join(scriptDir, script + '.sh');
};
var spawnScript = function spawnScript(script) {
  return spawn(scriptPath(script), [], spawnOpts);
};
var scriptError = function scriptError(code) {
  return new Error('Script exited with code: ' + code);
};
var scriptDone = function scriptDone(done) {
  return function (code) {
    return done(code ? scriptError(code) : null);
  };
};
var runScript = function runScript(script) {
  return function (done) {
    return spawnScript(script).on('close', scriptDone(done));
  };
};

var getLeader = function getLeader(wait) {
  return function (done) {
    return setTimeout(function () {
      return consul({}).status.leader(done);
    }, wait);
  };
};
var hasNoLeader = function hasNoLeader(leader) {
  return (leader || '').length === 0;
};
var awaitLeader = function awaitLeader(done) {
  return async.doWhilst(getLeader(200), hasNoLeader, errorOnly(done));
};
var status = getLeader(0);
var initVault = function initVault(done) {
  return vault({}).init({ secret_shares: 1, secret_threshold: 1 }, done);
};

var storeSecrets = function storeSecrets(secrets, done) {
  consul({}).kv.set({
    key: 'playground/secrets',
    value: JSON.stringify(secrets)
  }, function (err) {
    return done(err, err ? null : secrets);
  });
};

var unsealVault = function unsealVault(secrets, done) {
  return vault({ token: secrets.root_token }).unseal({ key: secrets.keys[0] }, done);
};
var vaultSecrets = function vaultSecrets(done) {
  return consul({}).kv.get({ key: 'playground/secrets' }, done);
};
var parseSecrets = function parseSecrets(secrets, resp, done) {
  return process.nextTick(done.bind(null, null, JSON.parse(secrets.Value)));
};
var logSecrets = function logSecrets(secrets, done) {
  console.log('export VAULT_UNSEAL_KEY=' + secrets.keys[0]);
  console.log('export VAULT_TOKEN=' + secrets.root_token);
  console.log('# Run this command to configure your shell for vault:');
  console.log('# eval $(pmpy playground env)');
  console.log();
  process.nextTick(done.bind(null, null, secrets));
};

// Since the resulting sequence is used directly from the cli, yargs will pass itself in as the first param - do a
// quick typeof check and ignore 'done' if it isn't a function
var sequence = function sequence(steps) {
  return function (done) {
    async.waterfall(steps, typeof done === 'function' ? done : logIfError);
  };
};
var waitReadySequence = [awaitLeader, initVault, storeSecrets, logSecrets, unsealVault];
var startSequence = [runScript('start')].concat(waitReadySequence);
var resetSequence = [runScript('reset')].concat(waitReadySequence);
var stopSequence = [runScript('stop')];
var envSequence = [vaultSecrets, parseSecrets, logSecrets];
var restartSequence = stopSequence.concat(startSequence);

module.exports = exports = {
  awaitLeader: awaitLeader,
  env: sequence(envSequence),
  reset: sequence(resetSequence),
  restart: sequence(restartSequence),
  status: status,
  start: sequence(startSequence),
  stop: sequence(stopSequence),
  vaultSecrets: sequence([vaultSecrets, parseSecrets])
};
