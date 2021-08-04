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
			me.auditlog('generateotp channelid=' + channelid + ' userid=' + userid + ' status=101');
			res.json({status:101});
			return;
		}
		var userid = req.body.userid;
		if(typeof userid == 'undefined') {
			me.auditlog('generateotp channelid=' + channelid + ' userid=' + userid + ' status=102');
			res.json({status:102});
			return;
		}
		generateotppin(channelid, function(token,pin) {
			me.auditlog('generateotp channelid=' + channelid + ' userid=' + userid + ' token=' + token + ' otp=' + pin + ' status=0');
			me.lib_push.push({opts:me.opts,user:store.user[userid],pin:pin});
			res.json({status:0,token:token});
		});
	},
	
	verifyotp : function(req, res) {
		var me = this;
		var channelid = req.body.channelid;
		if(typeof store.channel[channelid] == 'undefined') {
			me.auditlog('verifyotp channelid=' + channelid + ' token=' + token + ' otp=' + otp + ' status=101');
			res.json({status:101});
			return;
		}
		var token = req.body.token;
		if(token == null || token.length == 0) {
			me.auditlog('verifyotp channelid=' + channelid + ' token=' + token + ' otp=' + otp + ' status=102');
			res.json({status:102});
			return;
		}
		
		if(typeof store.otp[token] == 'undefined') {
			me.auditlog('verifyotp channelid=' + channelid + ' token=' + token + ' otp=' + otp + ' status=104');
			res.json({status:104});
			return;
		}
		var otp = req.body.otp;
		if(store.otp[token] == otp) {
			me.auditlog('verifyotp channelid=' + channelid + ' token=' + token + ' otp=' + otp + ' status=0');
			delete store.otp[token];
			res.json({status:0});
			return;
		}
		else {
			me.auditlog('verifyotp channelid=' + channelid + ' token=' + token + ' otp=' + otp + ' status=401');
			delete store.otp[token];
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
	
	auditlog : function(msg) {
		var item = {datetime:new Date(), msg:msg};
		this._audit.push(item);
		if(this._audit.length > 100) {
			this._audit.splice(0,1);
		}
	},
	_audit : [],
	
	_generateotppin : generateotppin,
	
	_store : store
};
module.exports = lib;
