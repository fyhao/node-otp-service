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
			  channelid : 'test',
			  userid : 'fyhao'
		  }
	  };
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 0);
			  assert.equal(json.token.length > 0, true);
			  assert.equal(lib.lib_push.msgs.length, 1);
			  done();
		  }
	  };
	  lib.lib_push.msgs = [];
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
			  assert.equal(lib.lib_push.msgs.length, 0);
			  done();
		  }
	  };
	  lib.lib_push.msgs = [];
	  lib.generateotp(req, res);
    });
	it('should not able to generate otp if invalid userid', function(done) {
	  var lib = require('../lib.js');
	  var req = {
		  body : {
			  channelid : 'test'
		  }
	  };
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 102);
			  assert.equal(json.token == null, true);
			  assert.equal(lib.lib_push.msgs.length, 0);
			  done();
		  }
	  };
	  lib.lib_push.msgs = [];
	  lib.generateotp(req, res);
    });
  });
  
  describe('#verifyotp()', function() {
    it('should able to verify otp', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  lib.lib_push.msgs = [];
	  step1();
	  function step2() {
		  var req = {body:{channelid:'test',token:token,otp:lib._store.otp[token]}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status, 0);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
	
	it('should not able to verify otp if invalid channelid', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  lib.lib_push.msgs = [];
	  step1();
	  function step2() {
		  var req = {body:{channelid:'invalid',token:token,otp:lib._store.otp[token]}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status, 101);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
	
	it('should not able to verify otp if invalid token 1', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  lib.lib_push.msgs = [];
	  step1();
	  function step2() {
		  var req = {body:{channelid:'test',otp:lib._store.otp[token]}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status, 102);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
	
	it('should not able to verify otp if invalid token 2', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  lib.lib_push.msgs = [];
	  step1();
	  function step2() {
		  var req = {body:{channelid:'test',token:token+'invalid',otp:lib._store.otp[token]}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status, 104);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
	it('should not able to verify otp if invalid pin 1', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  lib.lib_push.msgs = [];
	  step1();
	  function step2() {
		  var req = {body:{channelid:'test',token:token,otp:'111111'}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status, 401);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
	
	it('should not able to verify otp twice for two times valid', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  lib.lib_push.msgs = [];
	  step1();
	  var otp = null;
	  function step2() {
		  otp = lib._store.otp[token];
		  var req = {body:{channelid:'test',token:token,otp:otp}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status, 0);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  step3();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
	  function step3() {
		  var req = {body:{channelid:'test',token:token,otp:otp}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status != 0, true);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
	
	it('should not able to verify otp twice for invalid 1st time valid 2nd time', function(done) {
	  var lib = require('../lib.js');
	  var token = null;
	  function step1() {
		lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
	    
	  }
	  lib.lib_push.msgs = [];
	  step1();
	  var otp = null;
	  function step2() {
		  otp = lib._store.otp[token];
		  var req = {body:{channelid:'test',token:token,otp:'invalid'}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status != 0, true);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  step3();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
	  function step3() {
		  var req = {body:{channelid:'test',token:token,otp:otp}};
		  var res = {
			  json : function(json) {
				  assert.equal(json.status != 0, true);
				  assert.equal(lib.lib_push.msgs.length, 1);
				  done();
			  }
		  };
		  lib.verifyotp(req, res);
	  }
    });
  });
  
  describe('#user()', function() {
    it('should create user', function(done) {
	  var lib = require('../lib.js');
      var req = {body:{action:'create'}};
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 0);
			  done();
		  }
	  };
	  lib.user(req, res);
    });
	it('should update user', function(done) {
	  var lib = require('../lib.js');
      var req = {body:{action:'update'}};
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 0);
			  done();
		  }
	  };
	  lib.user(req, res);
    });
	it('should delete user', function(done) {
	  var lib = require('../lib.js');
      var req = {body:{action:'delete'}};
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 0);
			  done();
		  }
	  };
	  lib.user(req, res);
    });
	it('should retrieve user', function(done) {
	  var lib = require('../lib.js');
      var req = {body:{action:'retrieve'}};
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 0);
			  done();
		  }
	  };
	  lib.user(req, res);
    });
	it('should return error if invalid action', function(done) {
	  var lib = require('../lib.js');
      var req = {body:{action:'invalid'}};
	  var res = {
		  json : function(json) {
			  assert.equal(json.status, 100);
			  done();
		  }
	  };
	  lib.user(req, res);
    });
  });
  
  describe('#generateotppin()', function() {
	it('should return PIN with length 6', function(done) {
	  var lib = require('../lib.js');
	  function step1() {
		  lib._generateotppin('test',function(token,pin) {
			  assert.equal(pin.length, 6);
			  done();
		  });
	  }
	  step1();
	});
    it('should return different unique pin each time when generate', function(done) {
      var lib = require('../lib.js');
	  var pin1 = null;
	  var pin2 = null;
	  function step1() {
		  lib._generateotppin('test',function(token,pin) {
			  pin1 = pin;
			  step2();
		  });
	  }
	  function step2() {
		  lib._generateotppin('test',function(token,pin) {
			  pin2 = pin;
			  step3();
		  });
	  }
	  function step3() {
		  assert.equal(pin1 != pin2, true);
		  done();
	  }
	  step1();
    });
  });
  describe('#auditlog()', function() {
	it('should limit 100', function(done) {
	  var lib = require('../lib.js');
	  var req = {
		  body : {
			  channelid : 'test',
			  userid : 'fyhao'
		  }
	  };
	  var res = {
		  json : function(json) {
		  }
	  };
	  
	  var expectedmax = 100;
	  var i = 0; while(i++<expectedmax+10)lib.generateotp(req, res);
	  assert.equal(100, lib._audit.length);
	  done();
	});
  });
});