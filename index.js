
module.exports = function(opts) {
	var port = process.env.PORT || 20003;
	const express = require('express')
	var bodyParser = require('body-parser')
	const app = express()
	var lib = require('./lib.js');
	lib.opts = opts;
	var lib_admin = require('./lib_admin.js');
	lib_admin.opts = opts;
	var jsonParser = bodyParser.json()

	app.get('/', function (req, res) {
	  res.send('Hello World!!344')
	})

	app.post('/generateotp', jsonParser, function(req, res) {
		lib.generateotp(req, res);
	});
	app.post('/verifyotp', jsonParser, function(req, res) {
		lib.verifyotp(req, res);
	});
	app.post('/user', jsonParser, function(req, res) {
		lib.user(req, res);
	});
	app.get('/testdebug', function(req, res) {
		res.json(lib._store);
	});
	
	app.get('/status', function(req, res) {
		var resjson = {};
		var starttime = new Date().getTime();
		var lib = require('./lib.js');
		var token = null;
		function step1() {
			lib.generateotp({body:{channelid:"test",userid:"fyhao"}},{json:function(json) {token = json.token;step2();}})
			
		}
		lib.lib_push.msgs = [];
		step1();
		function step2() {
			var req1 = {body:{channelid:'test',token:token,otp:lib._store.otp[token]}};
			var res1 = {
				json : function(json) {
					if(json.status == 0) {
						resjson.status = 0;
						var endtime = new Date().getTime();
						var diff = endtime - starttime;
						resjson.diffms = diff;
						var otpcnt = 0;
						for(var i in lib._store.otp) otpcnt++;
						resjson.otpcnt = otpcnt;
						res.json(resjson);
					 }
				}
			};
			lib.verifyotp(req1, res1);
		}
	});
	
	app.get('/admin/status', lib_admin.status);
	app.get('/admin/auditlog', lib_admin.auditlog(lib));
	  
	app.listen(port);
	
	if(typeof lib.opts.init != 'undefined') lib.opts.init({
		lib : lib,
		app : app
	});

}