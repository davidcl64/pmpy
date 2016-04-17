'use strict';
const spawn       = require('child_process').spawn;
const path        = require('path');
const async       = require('async');
const consul      = require('consul');
const vault       = require('node-vault');

const NOOP        = () => {};
const spawnOpts   = { stdio: ['ignore', process.stdout, process.stderr] };
const scriptPath  = path.join(__dirname, '..', '..', '..', 'services');
const builderNoOp = (yargs)  => yargs;
const runScript   = (script) => (done) => {
  done = done || NOOP;

  spawn(path.join(scriptPath, script + '.sh'), [], spawnOpts)
    .on('close', () => done());
};

const waitForLeader = (done) => {
  consul({}).status.leader((err,result) => {
    if(err) { return done(err); }

    if(result.length) { return done(); }

    setTimeout(waitForLeader.bind(null,done), 10);
  });
};

const initVault = (done) => {
  vault({}).init({ secret_shares: 1, secret_threshold: 1 }, done);
};

const storeSecrets = (secrets, done) => {
  consul({}).kv.set({
    key:    'playground/secrets',
    value:  JSON.stringify(secrets)
  }, (err) => done(err, err ? null : secrets));
};

const logSecrets   = (secrets, done) => {
  done = done || NOOP;

  console.log('export VAULT_UNSEAL_KEY=%s', secrets.keys[0]);
  console.log('export VAULT_TOKEN=%s',      secrets.root_token);
  console.log('# Run this command to configure your shell for vault:');
  console.log("# eval $(pmpy playground env)");
  console.log();
  process.nextTick(done.bind(null,null,secrets));
};

const unsealVault = (secrets, done) => {
  const opts   = {token: secrets.root_token};

  vault(opts).unseal({ secret_shares: 1, key: secrets.keys[0] }, done);
};

const getSecrets = (done) => {
  consul({}).kv.get({key: 'playground/secrets'}, (err, result) => {
    if(err) { return console.dir(err); }

    done(null, JSON.parse(result.Value));
  });
};

const sequence = (steps) => () => {
  async.waterfall(steps, (err) => { if(err) { console.dir(err); } });
};


const waitReadySequence = [waitForLeader, initVault, storeSecrets, logSecrets, unsealVault];
const startSequence     = [runScript('start')].concat(waitReadySequence);
const resetSequence     = [runScript('reset')].concat(waitReadySequence);
const stopSequence      = [runScript('stop')];
const envSequence       = [getSecrets, logSecrets];
const restartSequence   = stopSequence.concat(startSequence);

const start = {
  command:  'start',
  describe: 'Start playground services',
  builder:  builderNoOp,
  handler:  sequence(startSequence)
};

const stop = {
  command:  'stop',
  describe: 'Stop playground services',
  builder:  builderNoOp,
  handler:  sequence(stopSequence)
};

const restart = {
  command:  'restart',
  describe: 'Restart playground services',
  builder:  builderNoOp,
  handler:  sequence(restartSequence)
};

const reset = {
  command:  'reset',
  describe: 'Resets consul & vault without a full restart',
  builder:  builderNoOp,
  handler:  sequence(resetSequence)
};

const env = {
  command:  'env',
  describe: 'Display vault keys',
  builder:  builderNoOp,
  handler:  sequence(envSequence)
};

module.exports = exports = {
  command:  "playground <action>",
  describe: "Control the docker based playground for consul+vault",
  builder:  function(yargs) {
    return yargs
      .command(start)
      .command(stop)
      .command(restart)
      .command(reset)
      .command(env);
  },
  handler:  function() {}
};