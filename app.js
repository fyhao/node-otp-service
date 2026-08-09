'use strict';

require('./index.js')({
  init({ lib, app }) {
    app.get('/save', function save(req, res) {
      const fs = require('node:fs');
      fs.writeFileSync('config.json', JSON.stringify(lib._store));
      res.end('0');
    });
    app.get('/load', function load(req, res) {
      const fs = require('node:fs');
      const savedStore = JSON.parse(fs.readFileSync('config.json', 'utf8'));
      for (const key of Object.keys(savedStore)) lib._store[key] = savedStore[key];
      res.end('0');
    });
  }
});
