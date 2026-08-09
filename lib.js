'use strict';

const crypto = require('node:crypto');

const DEFAULT_OTP_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;

const store = {
  otp: {},
  user: {
    fyhao: {
      contact_method: 'telegram',
      telegramuserid: 'fyhao1234'
    }
  },
  channel: {
    test: {}
  }
};

function sixDigitPin() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function tokenId() {
  return crypto.randomBytes(24).toString('hex');
}

function timingSafePinEquals(expected, supplied) {
  const left = Buffer.from(String(expected));
  const right = Buffer.from(String(supplied));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function generateOtpPin(channelid, fn, options = {}) {
  const token = tokenId();
  const pin = sixDigitPin();
  const ttlMs = Number.isFinite(options.ttlMs) ? options.ttlMs : DEFAULT_OTP_TTL_MS;
  const maxAttempts = Number.isInteger(options.maxAttempts)
    ? options.maxAttempts
    : DEFAULT_MAX_ATTEMPTS;

  store.otp[token] = {
    pin,
    channelid,
    expiresAt: Date.now() + ttlMs,
    attemptsRemaining: Math.max(1, maxAttempts)
  };
  fn(token, pin);
}

function tokenForLog(token) {
  return typeof token === 'string' ? token.slice(0, 8) : '';
}

const lib = {
  opts: {},
  lib_push: require('./lib_push.js'),

  configure(options = {}) {
    this.opts = options;
    if (options.users) store.user = { ...options.users };
    if (options.channels) store.channel = { ...options.channels };
    return this;
  },

  async generateotp(req, res) {
    const body = req.body || {};
    const channelid = body.channelid;
    const userid = body.userid;

    if (!Object.prototype.hasOwnProperty.call(store.channel, channelid)) {
      this.auditlog(`generateotp channelid=${channelid} userid=${userid} status=101`);
      return res.json({ status: 101 });
    }
    if (typeof userid !== 'string' || userid.length === 0) {
      this.auditlog(`generateotp channelid=${channelid} userid=${userid} status=102`);
      return res.json({ status: 102 });
    }
    if (!Object.prototype.hasOwnProperty.call(store.user, userid)) {
      this.auditlog(`generateotp channelid=${channelid} userid=${userid} status=103`);
      return res.json({ status: 103 });
    }

    let token;
    let pin;
    generateOtpPin(channelid, (generatedToken, generatedPin) => {
      token = generatedToken;
      pin = generatedPin;
    }, {
      ttlMs: this.opts.otpTtlMs,
      maxAttempts: this.opts.maxAttempts
    });

    try {
      await this.lib_push.push({
        opts: this.opts,
        user: store.user[userid],
        pin,
        channelid,
        userid
      });
    } catch (error) {
      delete store.otp[token];
      this.auditlog(`generateotp channelid=${channelid} userid=${userid} status=500`);
      return res.json({ status: 500 });
    }

    this.auditlog(
      `generateotp channelid=${channelid} userid=${userid} token=${tokenForLog(token)} status=0`
    );
    return res.json({ status: 0, token });
  },

  verifyotp(req, res) {
    const body = req.body || {};
    const channelid = body.channelid;
    const token = body.token;

    if (!Object.prototype.hasOwnProperty.call(store.channel, channelid)) {
      this.auditlog(`verifyotp channelid=${channelid} token=${tokenForLog(token)} status=101`);
      return res.json({ status: 101 });
    }
    if (typeof token !== 'string' || token.length === 0) {
      this.auditlog(`verifyotp channelid=${channelid} token= status=102`);
      return res.json({ status: 102 });
    }

    const record = store.otp[token];
    if (!record) {
      this.auditlog(`verifyotp channelid=${channelid} token=${tokenForLog(token)} status=104`);
      return res.json({ status: 104 });
    }

    // Accept legacy string records loaded by older deployments.
    const expectedPin = typeof record === 'string' ? record : record.pin;
    if (typeof record !== 'string') {
      if (record.channelid !== channelid) {
        this.auditlog(`verifyotp channelid=${channelid} token=${tokenForLog(token)} status=104`);
        return res.json({ status: 104 });
      }
      if (record.expiresAt <= Date.now()) {
        delete store.otp[token];
        this.auditlog(`verifyotp channelid=${channelid} token=${tokenForLog(token)} status=410`);
        return res.json({ status: 410 });
      }
    }

    if (timingSafePinEquals(expectedPin, body.otp)) {
      delete store.otp[token];
      this.auditlog(`verifyotp channelid=${channelid} token=${tokenForLog(token)} status=0`);
      return res.json({ status: 0 });
    }

    if (typeof record === 'string') {
      delete store.otp[token];
    } else {
      record.attemptsRemaining -= 1;
      if (record.attemptsRemaining <= 0) delete store.otp[token];
    }
    this.auditlog(`verifyotp channelid=${channelid} token=${tokenForLog(token)} status=401`);
    return res.json({ status: 401 });
  },

  user(req, res) {
    const action = (req.body || {}).action;
    const allowedActions = ['create', 'update', 'delete', 'retrieve'];
    if (!allowedActions.includes(action)) return res.json({ status: 100 });
    return res.json({ status: 0 });
  },

  auditlog(msg) {
    this._audit.push({ datetime: new Date(), msg });
    if (this._audit.length > 100) this._audit.splice(0, 1);
  },

  _audit: [],
  _generateotppin: generateOtpPin,
  _store: store,
  _defaults: {
    otpTtlMs: DEFAULT_OTP_TTL_MS,
    maxAttempts: DEFAULT_MAX_ATTEMPTS
  }
};

module.exports = lib;
