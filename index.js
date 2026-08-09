'use strict';

module.exports = function createOtpService(opts = {}) {
  const express = require('express');
  const lib = require('./lib.js').configure(opts);
  const libAdmin = require('./lib_admin.js').configure(opts);
  const app = express();

  app.use(express.json({ limit: '16kb' }));

  app.get('/', function root(req, res) {
    res.send('node-otp-service');
  });

  app.post('/generateotp', function generate(req, res, next) {
    Promise.resolve(lib.generateotp(req, res)).catch(next);
  });
  app.post('/verifyotp', function verify(req, res) {
    lib.verifyotp(req, res);
  });
  app.post('/user', function user(req, res) {
    lib.user(req, res);
  });

  if (opts.enableDebug === true) {
    app.get('/testdebug', function debug(req, res) {
      res.json(lib._store);
    });
  }

  app.get('/status', async function status(req, res) {
    const start = Date.now();
    const channelid = Object.keys(lib._store.channel)[0];
    if (!channelid) return res.status(503).json({ status: 101 });
    let token;
    let pin;
    lib._generateotppin(channelid, function generated(generatedToken, generatedPin) {
      token = generatedToken;
      pin = generatedPin;
    });
    const record = lib._store.otp[token];
    return lib.verifyotp(
      { body: { channelid, token, otp: pin || record.pin } },
      { json(json) {
        res.status(json.status === 0 ? 200 : 503).json({
          status: json.status,
          diffms: Date.now() - start,
          otpcnt: Object.keys(lib._store.otp).length
        });
      } }
    );
  });

  app.get('/admin/status', libAdmin.status);
  app.get('/admin/auditlog', libAdmin.auditlog(lib));

  let server = null;
  if (opts.listen !== false) {
    const port = opts.port || process.env.PORT || 20003;
    server = app.listen(port);
  }

  if (typeof opts.init === 'function') opts.init({ lib, app, server });
  return { lib, app, server };
};
