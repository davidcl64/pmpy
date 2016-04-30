var consulClient  = require('consul');
var path          = require('path');
var fs            = require('fs');
var _             = require('lodash/fp');
var pmpy          = require('../../' + (process.env.PMPY_TARGET || 'src') + '/lib');

function clean(done) {
  consulClient({}).kv.del( {key: "unittest", recurse: true }, done);
}

var fixturePath = path.join(__dirname, '..', 'fixtures');

function jsonFixture(name) {
  return JSON.parse(JSON.stringify(require(path.join(fixturePath,name))));
}

function envFixture(name) {
  return fs.readFileSync(name).toString();
}

function fixture(name) {
  if(name.split('.').pop() === 'json') { return jsonFixture(name); }
  
  return envFixture(name);
}

function hooks(fnOut, fnErr, fnExit) {
  var writeOut = process.stdout.write;
  var writeErr = process.stderr.write;
  var exit     = process.exit;
  
  process.stdout.write  = fnOut   || process.stdout.write;
  process.stderr.write  = fnErr   || process.stderr.write;
  process.exit          = fnExit  || process.exit;
  
  return function unhook() {
    process.stdout.write = writeOut;
    process.stderr.write = writeErr;
    process.exit          = exit;
  };
}

function seed(done) {
  var fixtures  = ['consul_kv_a.json', 'consul_kv_b.json', 'consul_kv_c.json', 'consul_kv_array.json'];
  var noop      = function() {};
  var count     = fixtures.length;
  var complete  = function() {
    count--;
    if(!count) { done(); }
  };
  var subscribe = _.tap(function(observable) { observable.subscribe(noop,done,complete); });
  
  var consul = pmpy.consul({ prefix: 'unittest' });
  _.flow(
    _.map(function(name) { return consul.push(name, fixture(name)); }),
    _.map(subscribe)
  )(fixtures);
}


module.exports = exports = {
  clean:        clean,
  fixturePath:  fixturePath,
  fixture:      fixture,
  hooks:        hooks,
  seed:         seed
};
