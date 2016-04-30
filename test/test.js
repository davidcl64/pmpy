'use strict';

describe('pmpy node module', function () {
  describe('lib', function() {
    require('./lib/util_test');
    require('./lib/consul_test');
  });
  
  describe('cli', function() {
    require('./bin/consul_test');
  });
});
