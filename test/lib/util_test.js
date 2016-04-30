'use strict';
//var assert = require('assert');
var chai          = require('chai');
var expect        = chai.expect;
var sinon         = require('sinon');
var path          = require('path');
var mockStdin     = require('mock-stdin');
var unit          = require('../util');

chai.use(require('sinon-chai'));

  
describe('util', function() {
  /* jshint expr:true */
  var fixturePath = path.join(__dirname, '..', 'fixtures');
  
  var util = require('../../' + (process.env.PMPY_TARGET || 'src') + '/lib').util;
  var stdin;
  
  beforeEach(function() {
    stdin = mockStdin.stdin();
  });
  
  afterEach(function() {
    stdin.restore();
  });

  it('should read from a string when no prefix is given', function(done) {
    var expected = {"Hello": "World"};
    util.json.read(JSON.stringify(expected))
      .subscribe(
        function(doc) { expect(doc).to.deep.equal(expected); },
        function(err) { expect(err).to.not.exist; },
        done
      );
  });
      
  it('should read a json file when prefixed with @', function(done) {
    util.json.read('@' + path.join(fixturePath, 'consul_kv_a.json'))
      .subscribe(
        function(doc) { expect(doc).to.deep.equal(unit.fixture('consul_kv_a.json')); },
        function(err) { expect(err).to.not.exist; },
        done
      );
  });

  it('should read from stdin when prefixed with -', function(done) {
    var expected = {"Hello": "World"};
    util.json.read('-')
      .subscribe(
        function(doc) { expect(doc).to.deep.equal(expected); },
        function(err) { expect(err).to.not.exist; },
        done
      );
      
    stdin.send(JSON.stringify(expected));
    stdin.end();  
  });
  
  it('should read an env file', function(done) {
    util.env.read('@' + path.join(fixturePath, 'consul_kv_a.env'))
      .subscribe(
        function(doc) { expect(doc).to.deep.equal(unit.fixture('consul_kv_a.json')); },
        function(err) { expect(err).to.not.exist; },
        done
      );
  });
  
  it('should not read anything when not passed a param', function(done) {
    util.json.read()
      .subscribe(
        function(doc) { expect(doc).to.not.exits; },
        function(err) { expect(err).to.not.exist; },
        done
      );
    });
    
  it('should print json', function() {
    var expected = {"Hello": "World"};
    var logStub  = sinon.stub(console, 'log');
    util.json.print(expected);
    logStub.restore();
    
    expect(logStub).to.have.been.calledOnce;
    expect(logStub).to.have.been.calledWith('{\n  "Hello": "World"\n}');
  });  

  it('should print env', function() {
    var expected = {"Hello": "World"};
    var logStub  = sinon.stub(console, 'log');
    util.env.print(expected);
    logStub.restore();
    
    expect(logStub).to.have.been.calledOnce;
    expect(logStub).to.have.been.calledWith('export %s=\'%s\'', 'Hello', '"World"');
  });  
});
