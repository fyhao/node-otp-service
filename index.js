var port = process.env.PORT || 20003;
const express = require('express')
var bodyParser = require('body-parser')
const app = express()
var lib = require('./lib.js');
 
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
  
app.listen(port)