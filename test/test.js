'use strict';
//var assert = require('assert');
var chai          = require('chai');
var expect        = chai.expect;
var path          = require('path');
var _             = require('lodash');
var pmpy          = require('../' + (process.env.PMPY_TARGET || 'src') + '/lib');
var consulClient  = require('consul');
var tryParse      = require('../' + (process.env.PMPY_TARGET || 'src') + '/lib').util.tryParse;

describe('pmpy node module', function () {
  /* jshint expr:true */
  beforeEach(function(done) {
    consulClient({}).kv.del( {key: "unittest", recurse: true }, done);
  });
  
  var fixturePath = path.join(__dirname, 'fixtures');
  function getFixture(name) {
    return JSON.parse(JSON.stringify(require(path.join(fixturePath,name))));
  }

  describe('Consul', function() {
    describe('housekeeping', function() {
      it('should construct a consul object', function() {
        var consul = pmpy.consul({ prefix: 'unittest' });
        expect(consul).to.have.all.keys(['_', 'push', 'pull']);    
      });
    });
    
    describe('utility helpers', function() {
      var util = pmpy.consul._;
      var record = {
        __prefix: 'unittest/',
        Key:      'unittest/expected/result'
      };
      
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
      
      [{ Value: "1",          original: 1,          expected: "number",     type: "number"    },
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
      
      it('should have cleaned up "unittest"', function(done) {
        consulClient({}).kv.get({key: 'unittest/', recurse: 'true'}, function(err,result) {
          expect(err).to.not.exist;
          expect(result).to.not.exist;
          done();
        });        
      });
    });
    
    describe('push', function() {
      var consul;
      var kvPairs;
      
      before(function() {
        consul = pmpy.consul({ prefix: 'unittest' });
      });
      
      beforeEach(function() {
        kvPairs = [];
      });
      
      function getKv(key) {
        return _.find(kvPairs, {key: key});
      }
      
      it('should push data into consul', function(done) {
        var data    = getFixture('consul_kv.json');
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
              expect(_.sortBy(consulResult, ['key'])).to.deep.equal(_.sortBy(kvPairs, ['key']));
              done();
            });
          }
        );
      });
    });
  });
});
