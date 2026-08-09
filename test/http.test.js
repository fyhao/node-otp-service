'use strict';

const assert = require('node:assert/strict');
const createOtpService = require('../index.js');

describe('HTTP service', function () {
  let baseUrl;
  let server;
  let deliveredPin;

  before(function (done) {
    const { app } = createOtpService({
      listen: false,
      adminApiKey: 'admin-secret',
      channels: { login: {} },
      users: { alice: { contact_method: 'test' } },
      connectors: { test({ pin }) { deliveredPin = pin; } }
    });
    server = app.listen(0, '127.0.0.1', function listening() {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  after(function (done) {
    server.close(done);
  });

  it('generates and verifies an OTP over HTTP', async function () {
    const generated = await fetch(`${baseUrl}/generateotp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channelid: 'login', userid: 'alice' })
    }).then((response) => response.json());
    assert.equal(generated.status, 0);

    const verified = await fetch(`${baseUrl}/verifyotp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channelid: 'login', token: generated.token, otp: deliveredPin })
    }).then((response) => response.json());
    assert.deepEqual(verified, { status: 0 });
  });

  it('reports service health without calling a delivery provider', async function () {
    const status = await fetch(`${baseUrl}/status`).then((response) => response.json());
    assert.equal(status.status, 0);
    assert.equal(status.otpcnt, 0);
    assert.equal(typeof status.diffms, 'number');
  });

  it('protects admin endpoints with the configured API key', async function () {
    const denied = await fetch(`${baseUrl}/admin/status`).then((response) => response.json());
    assert.deepEqual(denied, { status: 401 });

    const allowed = await fetch(`${baseUrl}/admin/status`, {
      headers: { 'x-api-key': 'admin-secret' }
    }).then((response) => response.json());
    assert.deepEqual(allowed, { status: 0 });
  });

  it('does not expose the debug store by default', async function () {
    const response = await fetch(`${baseUrl}/testdebug`);
    assert.equal(response.status, 404);
  });
});
