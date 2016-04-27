var consulClient  = require('consul');
var path          = require('path');
var fs            = require('fs');

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

module.exports = exports = {
  clean:    clean,
  fixture:  fixture
};
