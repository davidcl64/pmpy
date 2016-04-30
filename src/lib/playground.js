'use strict';
const spawn       = require('child_process').spawn;
const path        = require('path');
const async       = require('async');
const consul      = require('consul');
const vault       = require('node-vault');

const logIfError  = (err)    => { if(err) { console.dir(err); } };
const errorOnly   = (done)   => (err) => done(err);
const spawnOpts   = { stdio: ['ignore', process.stdout, process.stderr] };
const scriptDir   = path.join(__dirname, '..', '..', 'services');
const scriptPath  = (script) => path.join(scriptDir, `${script}.sh`);
const spawnScript = (script) => spawn(scriptPath(script), [], spawnOpts);
const scriptError = (code)   => new Error(`Script exited with code: ${code}`);
const scriptDone  = (done)   => (code) => done(code ? scriptError(code) : null);
const runScript   = (script) => (done) => spawnScript(script).on('close', scriptDone(done));

const getLeader   = (wait)   => (done) => setTimeout(() => consul({}).status.leader(done), wait);
const hasNoLeader = (leader) => (leader || '').length === 0;
const awaitLeader = (done)   => async.doWhilst(getLeader(200), hasNoLeader, errorOnly(done));
const status      = getLeader(0);
const initVault   = (done) => vault({}).init({ secret_shares: 1, secret_threshold: 1 }, done);

const storeSecrets = (secrets, done) => {
  consul({}).kv.set({
    key:    'playground/secrets',
    value:  JSON.stringify(secrets)
  }, (err) => done(err, err ? null : secrets));
};

const unsealVault   = (secrets, done) => vault({token: secrets.root_token}).unseal({key: secrets.keys[0]}, done);
const vaultSecrets  = (done) => consul({}).kv.get({key: 'playground/secrets'}, done);
const parseSecrets  = (secrets, resp, done) => process.nextTick(done.bind(null,null,JSON.parse(secrets.Value)));
const logSecrets    = (secrets, done) => {
  console.log(`export VAULT_UNSEAL_KEY=${secrets.keys[0]}`);
  console.log(`export VAULT_TOKEN=${secrets.root_token}`);
  console.log('# Run this command to configure your shell for vault:');
  console.log('# eval $(pmpy playground env)');
  console.log();
  process.nextTick(done.bind(null,null,secrets));
};

// Since the resulting sequence is used directly from the cli, yargs will pass itself in as the first param - do a 
// quick typeof check and ignore 'done' if it isn't a function
const sequence          = (steps) => (done) => { async.waterfall(steps, typeof done === 'function' ? done : logIfError); };
const waitReadySequence = [awaitLeader, initVault, storeSecrets, logSecrets, unsealVault];
const startSequence     = [runScript('start')].concat(waitReadySequence);
const resetSequence     = [runScript('reset')].concat(waitReadySequence);
const stopSequence      = [runScript('stop')];
const envSequence       = [vaultSecrets, parseSecrets, logSecrets];
const restartSequence   = stopSequence.concat(startSequence);

module.exports = exports = {
  awaitLeader:  awaitLeader,
  env:          sequence(envSequence),
  reset:        sequence(resetSequence),
  restart:      sequence(restartSequence),
  status:       status,
  start:        sequence(startSequence),
  stop:         sequence(stopSequence),
  vaultSecrets: sequence([vaultSecrets, parseSecrets])
};
