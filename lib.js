var lib = {
	
	generateotp : function(req, res) {
		var channelid = req.body.channelid;
		if(channelid != 'test') {
			res.json({status:101});
			return;
		}
		generateotp(channelid, function(token) {
			res.json({status:0,token:token});
		});
	},
	
	verifyotp : function(req, res) {
		var channelid = req.body.channelid;
		if(channelid != 'test') {
			res.json({status:101});
			return;
		}
		var token = req.body.token;
		if(token == null || token.length == 0) {
			res.json({status:102});
			return;
		}
		if(typeof store.token[channelid] == 'undefined') {
			res.json({status:103});
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
	}
};
var generateotp = function(channelid,fn) {
	var token = '1234';
	store.token[channelid] = token;
	store.otp[token] = '567812'; // random 6 digit todo
	fn(store.token[channelid]);
}
var store = {
	token : {},
	otp : {}
};
module.exports = lib;
