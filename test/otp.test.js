'use strict';

const assert = require('node:assert/strict');
const lib = require('../lib.js');
const push = require('../lib_push.js');

function clear(object) {
  for (const key of Object.keys(object)) delete object[key];
}

async function generate(body) {
  let response;
  await lib.generateotp({ body }, { json(value) { response = value; } });
  return response;
}

function verify(body) {
  let response;
  lib.verifyotp({ body }, { json(value) { response = value; } });
  return response;
}

describe('OTP service', function () {
  let delivered;

  beforeEach(function () {
    clear(lib._store.otp);
    lib._audit.length = 0;
    push.msgs.length = 0;
    delivered = [];
    lib.configure({
      channels: { test: {}, secondary: {} },
      users: {
        alice: { contact_method: 'telegram', telegramuserid: '1001' }
      },
      connectors: {
        telegram(event) { delivered.push(event); }
      }
    });
  });

  describe('generation', function () {
    it('creates a secure six-digit OTP and opaque token', function (done) {
      lib._generateotppin('test', function (token, pin) {
        assert.match(token, /^[a-f0-9]{48}$/);
        assert.match(pin, /^\d{6}$/);
        assert.equal(lib._store.otp[token].pin, pin);
        assert.equal(lib._store.otp[token].channelid, 'test');
        done();
      });
    });

    it('generates unique tokens', function () {
      const tokens = new Set();
      for (let i = 0; i < 100; i += 1) {
        lib._generateotppin('test', function (token) { tokens.add(token); });
      }
      assert.equal(tokens.size, 100);
    });

    it('delivers the OTP but only returns the token to the caller', async function () {
      const result = await generate({ channelid: 'test', userid: 'alice' });
      assert.equal(result.status, 0);
      assert.match(result.token, /^[a-f0-9]{48}$/);
      assert.equal(Object.hasOwn(result, 'otp'), false);
      assert.equal(delivered.length, 1);
      assert.equal(delivered[0].pin, lib._store.otp[result.token].pin);
    });

    it('rejects invalid request identifiers', async function () {
      assert.deepEqual(await generate({ channelid: 'missing', userid: 'alice' }), { status: 101 });
      assert.deepEqual(await generate({ channelid: 'test' }), { status: 102 });
      assert.deepEqual(await generate({ channelid: 'test', userid: 'unknown' }), { status: 103 });
      assert.equal(delivered.length, 0);
    });

    it('removes the OTP if delivery fails', async function () {
      lib.configure({
        channels: { test: {} },
        users: { alice: { contact_method: 'telegram' } },
        connectors: { telegram() { throw new Error('provider unavailable'); } }
      });
      assert.deepEqual(await generate({ channelid: 'test', userid: 'alice' }), { status: 500 });
      assert.equal(Object.keys(lib._store.otp).length, 0);
    });
  });

  describe('verification', function () {
    it('accepts a correct OTP once', async function () {
      const generated = await generate({ channelid: 'test', userid: 'alice' });
      const pin = lib._store.otp[generated.token].pin;
      assert.deepEqual(verify({ channelid: 'test', token: generated.token, otp: pin }), { status: 0 });
      assert.deepEqual(verify({ channelid: 'test', token: generated.token, otp: pin }), { status: 104 });
    });

    it('allows configured retries and locks the token at the attempt limit', async function () {
      lib.configure({
        channels: { test: {} },
        users: { alice: { contact_method: 'telegram' } },
        connectors: { telegram() {} },
        maxAttempts: 2
      });
      const generated = await generate({ channelid: 'test', userid: 'alice' });
      assert.deepEqual(verify({ channelid: 'test', token: generated.token, otp: 'bad' }), { status: 401 });
      assert.equal(lib._store.otp[generated.token].attemptsRemaining, 1);
      assert.deepEqual(verify({ channelid: 'test', token: generated.token, otp: 'bad' }), { status: 401 });
      assert.equal(lib._store.otp[generated.token], undefined);
    });

    it('rejects expired OTPs', async function () {
      lib.configure({
        channels: { test: {} },
        users: { alice: { contact_method: 'telegram' } },
        connectors: { telegram() {} },
        otpTtlMs: -1
      });
      const generated = await generate({ channelid: 'test', userid: 'alice' });
      const pin = lib._store.otp[generated.token].pin;
      assert.deepEqual(verify({ channelid: 'test', token: generated.token, otp: pin }), { status: 410 });
      assert.equal(lib._store.otp[generated.token], undefined);
    });

    it('binds each token to its channel', async function () {
      const generated = await generate({ channelid: 'test', userid: 'alice' });
      const pin = lib._store.otp[generated.token].pin;
      assert.deepEqual(
        verify({ channelid: 'secondary', token: generated.token, otp: pin }),
        { status: 104 }
      );
      assert.notEqual(lib._store.otp[generated.token], undefined);
    });

    it('validates channel and token inputs', function () {
      assert.deepEqual(verify({ channelid: 'missing' }), { status: 101 });
      assert.deepEqual(verify({ channelid: 'test' }), { status: 102 });
      assert.deepEqual(verify({ channelid: 'test', token: 'unknown', otp: '123456' }), { status: 104 });
    });

    it('does not write OTP values into audit logs', async function () {
      const generated = await generate({ channelid: 'test', userid: 'alice' });
      const pin = lib._store.otp[generated.token].pin;
      verify({ channelid: 'test', token: generated.token, otp: pin });
      assert.equal(lib._audit.some((item) => item.msg.includes(pin)), false);
      assert.equal(lib._audit.length, 2);
    });

    it('keeps only the latest 100 audit entries', function () {
      for (let i = 0; i < 110; i += 1) lib.auditlog(`entry ${i}`);
      assert.equal(lib._audit.length, 100);
      assert.equal(lib._audit[0].msg, 'entry 10');
    });
  });

  describe('push connectors', function () {
    it('supports connector objects', async function () {
      let received;
      await push.push({
        opts: { connectors: { sms: { send(event) { received = event.pin; } } } },
        user: { contact_method: 'sms' },
        pin: '123456'
      });
      assert.equal(received, '123456');
    });

    it('posts Telegram messages when credentials are configured', async function () {
      let request;
      await push.push({
        opts: {
          telegramToken: 'secret',
          fetch(url, options) {
            request = { url, options };
            return Promise.resolve({ ok: true });
          }
        },
        user: { contact_method: 'telegram', telegramuserid: '42' },
        pin: '123456'
      });
      assert.equal(request.url, 'https://api.telegram.org/botsecret/sendMessage');
      assert.equal(request.options.body.get('chat_id'), '42');
      assert.equal(request.options.body.get('text'), 'Your pin is 123456');
    });

    it('posts Pushover messages when credentials are configured', async function () {
      let request;
      await push.push({
        opts: {
          pushoverToken: 'app-token',
          fetch(url, options) {
            request = { url, options };
            return Promise.resolve({ ok: true });
          }
        },
        user: { contact_method: 'pushover', pushoveruserid: 'user-key' },
        pin: '654321'
      });
      assert.equal(request.url, 'https://api.pushover.net/1/messages.json');
      assert.equal(request.options.body.get('user'), 'user-key');
      assert.equal(request.options.body.get('message'), 'Your pin is 654321');
    });

    it('rejects unsupported or failed providers', async function () {
      await assert.rejects(
        push.push({ opts: {}, user: { contact_method: 'unknown' }, pin: '123456' }),
        /Unsupported contact method/
      );
      await assert.rejects(
        push.push({
          opts: { telegramToken: 'secret', fetch: async () => ({ ok: false, status: 503 }) },
          user: { contact_method: 'telegram', telegramuserid: '42' },
          pin: '123456'
        }),
        /HTTP 503/
      );
    });
  });
});
