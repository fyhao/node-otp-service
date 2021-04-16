var assert = require('assert');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
  
  
  describe('#generateotp()', function() {
    it('should able to generate otp', function(done) {
	  var lib = require('../lib.js');
	  var req = {
		  body : {
			  channelid : 'test'
		  }
	  };
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 0);
			  assert.equal(json.token.length > 0, true);
			  done();
		  }
	  };
	  lib.generateotp(req, res);
    });
	it('should not able to generate otp if invalid channelid', function(done) {
	  var lib = require('../lib.js');
	  var req = {
		  body : {
			  channelid : 'invalid'
		  }
	  };
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 101);
			  assert.equal(json.token == null, true);
			  done();
		  }
	  };
	  lib.generateotp(req, res);
    });
  });
  
  describe('#verifyotp()', function() {
    it('should able to verify otp', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  step1();
	  function step2() {
		  var req = {body:{channelid:'test',token:token,otp:'567812'}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status, 0);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
  });
});