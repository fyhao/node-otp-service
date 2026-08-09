'use strict';

function message(pin) {
  return `Your pin is ${pin}`;
}

async function postForm(fetchImpl, url, values) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values)
  });
  if (!response.ok) throw new Error(`Push provider returned HTTP ${response.status}`);
}

const lib = {
  msgs: [],

  async push(evt) {
    const { opts = {}, user } = evt;
    if (!user || typeof user.contact_method !== 'string') {
      throw new Error('User has no contact method');
    }

    const connector = opts.connectors && opts.connectors[user.contact_method];
    if (connector) {
      if (typeof connector === 'function') return connector(evt);
      if (typeof connector.send === 'function') return connector.send(evt);
      throw new Error(`Invalid ${user.contact_method} connector`);
    }

    if (user.contact_method === 'telegram') return this.sendTelegram(evt);
    if (user.contact_method === 'pushover') return this.sendPushover(evt);
    throw new Error(`Unsupported contact method: ${user.contact_method}`);
  },

  async sendTelegram(evt) {
    const { opts = {}, user, pin } = evt;
    const text = message(pin);
    if (!opts.telegramToken) {
      this.msgs.push(text);
      return;
    }
    const fetchImpl = opts.fetch || globalThis.fetch;
    if (typeof fetchImpl !== 'function') throw new Error('No fetch implementation available');
    await postForm(
      fetchImpl,
      `https://api.telegram.org/bot${opts.telegramToken}/sendMessage`,
      { chat_id: user.telegramuserid, text }
    );
  },

  async sendPushover(evt) {
    const { opts = {}, user, pin } = evt;
    const text = message(pin);
    if (!opts.pushoverToken) {
      this.msgs.push(text);
      return;
    }
    const fetchImpl = opts.fetch || globalThis.fetch;
    if (typeof fetchImpl !== 'function') throw new Error('No fetch implementation available');
    await postForm(fetchImpl, 'https://api.pushover.net/1/messages.json', {
      token: opts.pushoverToken,
      user: user.pushoveruserid,
      message: text
    });
  }
};

module.exports = lib;
