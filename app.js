require('./index.js')({
	init : function(opts) {
		var lib = opts.lib;
		var app = opts.app;
		app.get('/save', function(req, res) {
			var fs = require('fs');
			fs.writeFileSync('config.json', JSON.stringify(lib._store));
			res.end('0');
		});
		app.get('/load', function(req, res) {
			var fs = require('fs');
			var store = fs.readFileSync('config.json','utf8');
			store = JSON.parse(store);
			for(var i in store) {
				lib._store[i] = store[i];
			}
			res.end('0');
		});
		
	}
});