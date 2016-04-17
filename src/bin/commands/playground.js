'use strict';
const spawn       = require('child_process').spawn;
const path        = require('path');
const async       = require('async');
const consul      = require('consul');
const vault       = require('node-vault');

const builderNoOp = (yargs)  => yargs;
const errorOnly   = (done)   => (err) => done(err);
const spawnOpts   = { stdio: ['ignore', process.stdout, process.stderr] };
const scriptDir   = path.join(__dirname, '..', '..', '..', 'services');
const scriptPath  = (script) => path.join(scriptDir, `${script}.sh`);
const spawnScript = (script) => spawn(scriptPath(script), [], spawnOpts);
const scriptError = (code)   => new Error(`Script exited with code: ${code}`);
const scriptDone  = (done)   => (code) => done(code ? scriptError(code) : null);
const runScript   = (script) => (done) => spawnScript(script).on('close', scriptDone(done));

const getLeader   = (wait)   => (done) => setTimeout(() => consul({}).status.leader(done), wait);
const hasNoLeader = (leader) => (leader || '').length === 0;
const awaitLeader = (done)   => async.doWhilst(getLeader(200), hasNoLeader, errorOnly(done));

const initVault   = (done) => vault({}).init({ secret_shares: 1, secret_threshold: 1 }, done);

const storeSecrets = (secrets, done) => {
  consul({}).kv.set({
    key:    'playground/secrets',
    value:  JSON.stringify(secrets)
  }, (err) => done(err, err ? null : secrets));
};

const unsealVault   = (secrets, done) => vault({token: secrets.root_token}).unseal({key: secrets.keys[0]}, done);
const getSecrets    = (done) => consul({}).kv.get({key: 'playground/secrets'}, done);
const parseSecrets  = (secrets, resp, done) => process.nextTick(done.bind(null,null,JSON.parse(secrets.Value)));
const logSecrets    = (secrets, done) => {
  console.log(`export VAULT_UNSEAL_KEY=${secrets.keys[0]}`);
  console.log(`export VAULT_TOKEN=${secrets.root_token}`);
  console.log('# Run this command to configure your shell for vault:');
  console.log('# eval $(pmpy playground env)');
  console.log();
  process.nextTick(done.bind(null,null,secrets));
};

const sequence          = (steps) => () => async.waterfall(steps, (err) => { if(err) { console.dir(err); } });
const waitReadySequence = [awaitLeader, initVault, storeSecrets, logSecrets, unsealVault];
const startSequence     = [runScript('start')].concat(waitReadySequence);
const resetSequence     = [runScript('reset')].concat(waitReadySequence);
const stopSequence      = [runScript('stop')];
const envSequence       = [getSecrets, parseSecrets, logSecrets];
const restartSequence   = stopSequence.concat(startSequence);

const commands = [
  { command:  'start',
    describe: 'Start playground services',
    builder:  builderNoOp,
    handler:  sequence(startSequence) },

  { command:  'stop',
    describe: 'Stop playground services',
    builder:  builderNoOp,
    handler:  sequence(stopSequence) },

  { command:  'restart',
    describe: 'Restart playground services',
    builder:  builderNoOp,
    handler:  sequence(restartSequence) },

  { command:  'reset',
    describe: 'Resets consul & vault without a full restart',
    builder:  builderNoOp,
    handler:  sequence(resetSequence) },

  { command:  'env',
    describe: 'Display vault keys',
    builder:  builderNoOp,
    handler:  sequence(envSequence) }
];

module.exports = exports = {
  command:  "playground <action>",
  describe: "Control the docker based playground for consul+vault",
  builder:  (yargs) => { commands.forEach(yargs.command.bind(yargs)); return yargs; },
  handler:  function() {}
};