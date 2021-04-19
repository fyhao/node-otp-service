var randomNumStr = function() {
	return '' + Math.floor(100000 + Math.random() * 900000);
}
var generateotppin = function(channelid,fn) {
	var token = randomNumStr() + randomNumStr() + randomNumStr();
	store.otp[token] = randomNumStr(); // random 6 digit todo
	fn(token,store.otp[token]);
}
var store = {
	otp : {},
	user : {
		'fyhao' : {
			'contact_method' : 'telegram',
			'telegramuserid':'fyhao1234'
		}
	},
	channel : {
		'test' : {}
	}
};
var lib = {
	opts : {},
	lib_push : require('./lib_push.js'),
	generateotp : function(req, res) {
		var me = this;
		var channelid = req.body.channelid;
		if(typeof store.channel[channelid] == 'undefined') {
			res.json({status:101});
			return;
		}
		var userid = req.body.userid;
		if(typeof userid == 'undefined') {
			res.json({status:102});
			return;
		}
		generateotppin(channelid, function(token,pin) {
			me.lib_push.push({opts:me.opts,user:store.user[userid],pin:pin});
			res.json({status:0,token:token});
		});
	},
	
	verifyotp : function(req, res) {
		var channelid = req.body.channelid;
		if(typeof store.channel[channelid] == 'undefined') {
			res.json({status:101});
			return;
		}
		var token = req.body.token;
		if(token == null || token.length == 0) {
			res.json({status:102});
			return;
		}
		
		if(typeof store.otp[token] == 'undefined') {
			res.json({status:104});
			return;
		}
		var otp = req.body.otp;
		if(store.otp[token] == otp) {
			res.json({status:0});
			return;
		}
		else {
			res.json({status:401});
			return;
		}
	},
	
	user : function(req, res) {
		var action = req.body.action;
		var allowedactions = ['create','update','delete','retrieve'];
		if(allowedactions.indexOf(action) == -1) {
			res.json({status:100});
			return;
		}
		res.json({status:0});
	},
	
	_generateotppin : generateotppin,
	
	_store : store
};
module.exports = lib;
