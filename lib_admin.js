
var store = {
	apikey : '1234'
};
var auth = function(req, res) {
	if(req.headers['x-api-key'] == store.apikey) {
		return true;
	}
	return false;
};
var lib = {
	status : function(req, res) {
		var status = 401;
		if(!auth(req,res)) {
			status = 401;
			res.json({status:status});
			return;
		}
		status = 0;
		res.json({status:status});
	}
};
module.exports = lib;
