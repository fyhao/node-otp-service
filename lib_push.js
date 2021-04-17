var lib = {
	push : function(evt) {
		var opts = evt.opts;
		var user = evt.user;
		var pin = evt.pin;
		if(user.contact_method == 'telegram') {
			var telegramuserid = user.telegramuserid;
			this.sendTelegram(telegramuserid, pin);
		}
	},
	
	msgs : [],
	
	sendTelegram : function(userid, pin) {
		var msg = 'Your pin is ' + pin;
		this.msgs.push(msg);
	}
};
module.exports = lib;