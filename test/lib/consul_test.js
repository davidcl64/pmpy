'use strict';
//var assert = require('assert');
var chai          = require('chai');
var expect        = chai.expect;
var sinon         = require('sinon');
var _             = require('lodash/fp');
var pmpy          = require('../../' + (process.env.PMPY_TARGET || 'src') + '/lib');
var consulClient  = require('consul');
var tryParse      = require('../../' + (process.env.PMPY_TARGET || 'src') + '/lib').util.tryParse;
var unit          = require('../util');

chai.use(require('sinon-chai'));

describe('Consul', function() {
  /* jshint expr:true */
  describe('housekeeping', function() {
    it('should construct a consul object', function() {
      var consul = pmpy.consul();
      expect(consul._.prefix, 'Should default prefix to pmpy/').to.equal('pmpy/');
      expect(consul).to.have.all.keys(['_', 'push', 'pull']);    
    });
  });
  
  describe('utility helpers', function() {
    var util = pmpy.consul._;
    var record = {
      __prefix: 'unittest/',
      Key:      'unittest/expected/result'
    };
    
    beforeEach(unit.clean);
    
    it('should remove a prefix from the beginning of a string', function() {
      expect(util.rmPrefix('prefix', 'prefixExpected')).to.equal('Expected');
    });
    
    it('should not remove the prefix if it is not at the beginning', function() {
      expect(util.rmPrefix('prefix', 'NoprefixExpected')).to.equal('NoprefixExpected');
    });
    
    it('should unprefix Key and not change the original record', function() {
      expect(util.unPrefix(record).Key).to.equal('expected/result');
      expect(record.Key).to.equal('unittest/expected/result');
    });
    
    [ { Value: "1",          original: 1,          expected: "number",     type: "number"    },
      { Value: "\"string\"", original: "string",   expected: "string",     type: "string"    },
      { Value: "true",       original: true,       expected: "boolean",    type: "boolean"   },
      { Value: "null",       original: null,       expected: "null",       type: "object"    }
    ].forEach(function(record) {
      it('should properly unparse a ' + record.expected, function() {
        var result = util.parseValue(record);
        expect(result.Value).to.equal(record.original);
      });
    });
    
    it('should convert a record to a key, value object', function() {
      expect(util.consulToKV({Key: 'key', Value: 'value'})).to.deep.equal({key: 'key', value: 'value'});
    });
    
    it('should reduce an array of key/value objects to a single object', function() {
      var input  = [{key: 'key1', value: 'val1'},{key: 'key2', value: 'val2'}];
      var output = input.reduce(util.flattenKV, {});
      
      expect(output).to.have.keys(['key1', 'key2']);
      expect(output.key1).to.equal('val1');
      expect(output.key2).to.equal('val2');
    });
    
    it('should be able to use kvGet to retrieve a key', function(done) {
      consulClient({}).kv.set({key: 'unittest/key', value: 'val'}, function(err) {
        expect(err).to.not.exist;
        
        util.kvGet(consulClient({}))({key: 'unittest/key'})
          .subscribe(
            function(val) { expect(val).to.equal('val'); },
            function(err) { expect(err).to.not.exist;    },
            done
          );
      });
    });
    
    it('should respond with an error when consulClient errors on a get', function(done) {
      var client  = consulClient({});
      var getStub = sinon.stub(client.kv, 'get');

      getStub.callsArgWith(1, new Error('Whoops!'));
      util.kvGet(client)({key: 'unittest/key'})
        .subscribe(
          function() { expect(true, 'Should not have called onNext').to.be.false; },
          function(err) { 
            getStub.restore();
            expect(getStub).to.have.been.calledOnce;
            expect(err).to.exist; 
            done();
          },
          function() {
            expect(true, 'Should not have called onComplete').to.be.false;
          }
        );
    });
    
    it('should respond with an error when consulClient errors on a set', function(done) {
      var client  = consulClient({});
      var setStub = sinon.stub(client.kv, 'set');

      setStub.callsArgWith(1, new Error('Whoops!'));
      util.kvSet(client)({key: 'unittest/key'})
        .subscribe(
          function() { expect(true, 'Should not have called onNext').to.be.false; },
          function(err) { 
            setStub.restore();
            expect(setStub).to.have.been.calledOnce;
            expect(err).to.exist; 
            done();
          },
          function() {
            expect(true, 'Should not have called onComplete').to.be.false;
          }
        );
    });

    it('should have cleaned up "unittest"', function(done) {
      consulClient({}).kv.get({key: 'unittest', recurse: 'true'}, function(err,result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
        done();
      });        
    });
  });
  
  describe('push', function() {
    var consul;
    var kvPairs;
    var sortByKey = _.sortBy(['key']);
    
    before(function() {
      consul = pmpy.consul({ prefix: 'unittest' });
    });
    
    beforeEach(unit.clean);
    beforeEach(function() {
      kvPairs = [];
    });
    
    function getKv(key) {
      return _.find({key: key})(kvPairs);
    }
    
    it('should push data into consul', function(done) {
      var data    = unit.fixture('consul_kv_a.json');
      consul.push('testKey', data)
      .subscribe(
        function(kv)  { kvPairs.push(kv); },
        function(err) { expect(err).to.not.exist; },
        function() {
          expect(kvPairs).to.have.length(4);
          expect(getKv('unittest/testKey/one'         ).value).to.equal(data.one);
          expect(getKv('unittest/testKey/two/one'     ).value).to.equal(data.two.one);
          expect(getKv('unittest/testKey/two/two/one' ).value).to.equal(data.two.two.one);
          expect(getKv('unittest/testKey/two/two/two' ).value).to.equal(data.two.two.two);
          
          consulClient({}).kv.get({key: 'unittest/testKey', recurse: true}, function(err, result) {
            expect(err).to.not.exist;
            
            var consulResult = result.map(function(r) { return {key: r.Key, value: tryParse(r.Value)}; });
            expect(sortByKey(consulResult)).to.deep.equal(sortByKey(kvPairs));
            done();
          });
        }
      );
    });
    
    it('should support arrays', function(done) {
      var data    = unit.fixture('consul_kv_array.json');
      consul.push('testKey', data)
      .subscribe(
        function(kv)  { kvPairs.push(kv); },
        function(err) { expect(err).to.not.exist; },
        function() {
          expect(kvPairs).to.have.length(4);
          expect(getKv('unittest/testKey/one/0/name').value).to.equal(data.one[0].name);
          expect(getKv('unittest/testKey/one/1/name').value).to.equal(data.one[1].name);
          expect(getKv('unittest/testKey/two/0/name').value).to.equal(data.two[0].name);
          expect(getKv('unittest/testKey/two/1/name').value).to.equal(data.two[1].name);
          
          consulClient({}).kv.get({key: 'unittest/testKey', recurse: true}, function(err, result) {
            expect(err).to.not.exist;
            
            var consulResult = result.map(function(r) { return {key: r.Key, value: tryParse(r.Value)}; });
            expect(sortByKey(consulResult)).to.deep.equal(sortByKey(kvPairs));
            done();
          });
        }
      );
    });
  });
  
  describe('pull', function() {
    var consul;
    
    before(function(done) {
      var fixtures  = ['consul_kv_a.json', 'consul_kv_b.json', 'consul_kv_c.json', 'consul_kv_array.json'];
      var noop      = function() {};
      var count     = fixtures.length;
      var complete  = function() {
        count--;
        if(!count) { done(); }
      };
      var subscribe = _.tap(function(observable) { observable.subscribe(noop,done,complete); });
      
      consul = pmpy.consul({ prefix: 'unittest' });
      _.flow(
        _.map(function(name) { return consul.push(name, unit.fixture(name)); }),
        _.map(subscribe)
      )(fixtures);
    });
    
    after(unit.clean);
    
    it('should pull from consul', function(done) {
      var result, error;
      consul.pull('consul_kv_a.json')
        .subscribe(
          function(val) { result = val; },
          function(err) { error  = err; },
          function() {
            expect(error).to.not.exist;
            expect(result).to.exist;
            expect(result).to.deep.equal(unit.fixture('consul_kv_a.json'));
            done();
          }
        );
    });

    it('should merge multiple trees together', function(done) {
      var result, error;
      var expected = _.flow(_.merge(unit.fixture('consul_kv_b.json')), _.merge(unit.fixture('consul_kv_a.json')))({});
      consul.pull(['consul_kv_a.json','consul_kv_b.json'])
        .subscribe(
          function(val) { result = val; },
          function(err) { error  = err; },
          function() {
            expect(error).to.not.exist;
            expect(result).to.exist;
            expect(result).to.deep.equal(expected);
            done();
          }
        );
    });

    it('should pull arrays', function(done) {
      var result, error;
      var expected = unit.fixture('consul_kv_array.json');
      consul.pull('consul_kv_array.json')
        .subscribe(
          function(val) { result = val; },
          function(err) { error  = err; },
          function() {
            expect(error).to.not.exist;
            expect(result).to.exist;
            expect(result).to.deep.equal(expected);
            done();
          }
        );
    });
  });
});
