'use strict';

let options = {};

function auth(req) {
  const expected = options.adminApiKey || process.env.ADMIN_API_KEY;
  return typeof expected === 'string' && expected.length > 0 && req.headers['x-api-key'] === expected;
}

const lib = {
  configure(opts = {}) {
    options = opts;
    return this;
  },

  status(req, res) {
    return res.json({ status: auth(req) ? 0 : 401 });
  },

  auditlog(otpLib) {
    return function auditlogHandler(req, res) {
      if (!auth(req)) return res.json({ status: 401 });
      return res.json({ status: 0, logs: otpLib._audit });
    };
  }
};

module.exports = lib;
