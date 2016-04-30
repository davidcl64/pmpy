'use strict';
var chai          = require('chai');
var expect        = chai.expect;
var sinon         = require('sinon');
var _             = require('lodash/fp');
var path          = require('path');
var unit          = require('../util');
var hooks         = unit.hooks;
var cli           = {
  pull: require('../../' + (process.env.PMPY_TARGET || 'src') + '/bin/commands/consul_commands/pull'),
  push: require('../../' + (process.env.PMPY_TARGET || 'src') + '/bin/commands/consul_commands/push')
};

chai.use(require('sinon-chai'));

describe('consul', function() {
  /* jshint expr:true */
  describe('push', function() {

    beforeEach(unit.clean);
        
    it('should push json data into consul', function(done) {
      var eventStub = sinon.stub();

      cli.push.__handler({
        prefix: 'unittest',
        path:   'consul_kv_a.json',
        format: 'json',
        value:  '@' + path.join(unit.fixturePath, 'consul_kv_a.json')
      }).subscribe(
        eventStub,
        function(err) { expect(err).to.not.exist; },
        function() {
          expect(eventStub).to.have.callCount(4);
          done();
        }
      );
    });

    it('should push env data into consul', function(done) {
      var eventStub = sinon.stub();

      cli.push.__handler({
        prefix: 'unittest',
        path:   'consul_kv_a.env',
        format: 'env',
        value:  '@' + path.join(unit.fixturePath, 'consul_kv_a.env')
      }).subscribe(
        eventStub,
        function(err) { expect(err).to.not.exist; },
        function() {
          expect(eventStub).to.have.callCount(4);
          done();
        }
      );
    });

    it('should log an error if a file does not exist', function(done) {
      var eventStub = sinon.stub();

      cli.push.__handler({
        prefix: 'unittest',
        path:   'consul_kv_x.json',
        format: 'json',
        value:  '@' + path.join(unit.fixturePath, 'consul_kv_x.jons')
      }).subscribe(
        eventStub,
        function(err) { 
          expect(err).to.exist;
          expect(eventStub).to.have.callCount(0);
          done(); 
        },
        function() {
          expect('Complete was called').to.equal('Complete should not be called');
        }
      );
    });

    it('should log an error if a json file cannot be parsed', function(done) {
      var eventStub = sinon.stub();

      cli.push.__handler({
        prefix: 'unittest',
        path:   'consul_kv_bad.json',
        format: 'json',
        value:  '@' + path.join(unit.fixturePath, 'consul_kv_bad.json')
      }).subscribe(
        eventStub,
        function(err) { 
          expect(err).to.exist;
          expect(eventStub).to.have.callCount(0);
          done(); 
        },
        function() {
          expect('Complete was called').to.equal('Complete should not be called');
        }
      );
    });
    
    it('should log to stdio when successful', function(done) {
      var output   = '', outErr = false;
      var unhook = hooks(
        function(str) { output = output + str; },
        function()    { outErr = true; },
        function(code) {
          unhook();
                    
          expect(code).to.be.undefined;
          expect(output.split('\n').sort().join('\n')).to.equal(
            ("key: unittest/consul_kv_a.json/two/two/two, value: true\n" +
            "key: unittest/consul_kv_a.json/two/two/one, value: 221\n" +
            "key: unittest/consul_kv_a.json/one, value: one\n" +
            "key: unittest/consul_kv_a.json/two/one, value: 21\n").split('\n').sort().join('\n')
          );
          done();
        }
      );

      cli.push.handler({
        prefix: 'unittest',
        path:   'consul_kv_a.json',
        format: 'json',
        value:  '@' + path.join(unit.fixturePath, 'consul_kv_a.json')
      });
    });
    
    it('should log to stderr when unsuccessful', function(done) {
      var output = false, outErr = '';
      var unhook = hooks(
        function()      { output = true; },
        function(str)   { outErr = outErr + str; },
        function(code)  {
          unhook();
                    
          expect(code).to.be.above(0);
          expect(output).to.be.false;
          expect(outErr.length).to.be.above(0);
          done();
        }
      );
      
      cli.push.handler({
        prefix: 'unittest',
        path:   'consul_kv_bad.json',
        format: 'json',
        value:  '@' + path.join(unit.fixturePath, 'consul_kv_bad.json')
      });
    });    
        
  });
  
  describe('pull', function() {
    before(unit.seed);

    it('should pull json data from consul', function(done) {
      var eventStub = sinon.stub();

      cli.pull.__handler({
        prefix: 'unittest',
        path:   'consul_kv_a.json',
        format: 'json'
      }).subscribe(
        eventStub,
        function(err) { expect(err).to.not.exist; },
        function() {
          expect(eventStub).to.have.been.calledOnce;
          expect(eventStub.firstCall.args[0]).to.deep.equal(unit.fixture('consul_kv_a.json'));
          done();
        }
      );
    });      

    it('should pull & merge json data from consul', function(done) {
      var eventStub = sinon.stub();
      var expected  = _.flow(_.merge(unit.fixture('consul_kv_b.json')), _.merge(unit.fixture('consul_kv_a.json')))({});

      cli.pull.__handler({
        prefix: 'unittest',
        path:   ['consul_kv_a.json', 'consul_kv_b.json'],
        format: 'json'
      }).subscribe(
        eventStub,
        function(err) { expect(err).to.not.exist; },
        function() {
          expect(eventStub).to.have.been.calledOnce;
          expect(eventStub.firstCall.args[0]).to.deep.equal(expected);
          done();
        }
      );
    });    
    
    it('should pull env data from consul', function(done) {
      var output = '', outErr = false;
      var unhook = hooks(
        function(str) { output = output + str; },
        function()    { outErr = true; },
        function(code) {
          unhook();
          
          expect(code).to.be.undefined;
          expect(outErr).to.be.false;
          expect(output).to.equal(
            "export one='\"oneB\"'\n" +
            "export two__one='21'\n" +
            "export two__two__one='221'\n" +
            "export two__two__two='\"helloB\"'\n"
          );
          
          done();
        }
      );

      cli.pull.handler({
        prefix: 'unittest',
        path:   ['consul_kv_a.json', 'consul_kv_b.json'],
        format: 'env'
      });
    });      
  });
});
