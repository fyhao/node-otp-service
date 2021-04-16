var port = process.env.PORT || 20003;
const express = require('express')
var bodyParser = require('body-parser')
const app = express()
 
 // parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: 'application/*+json' }))
 
// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))
 
// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))

app.get('/', function (req, res) {
  res.send('Hello World!!3')
})
 
app.listen(port)