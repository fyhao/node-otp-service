# node-otp-service

A small Node.js service for generating and verifying one-time passwords. OTPs are generated with Node's cryptographic random-number APIs, expire after a configurable period, are bound to their channel, and can be delivered by Telegram, Pushover, or a custom connector.

## Requirements

- Node.js 18 or newer
- npm

## Run

```bash
npm install
node app.js
```

The server listens on `PORT` or port `20003` by default.

## API

Generate an OTP:

```http
POST /generateotp
Content-Type: application/json

{"channelid":"test","userid":"fyhao"}
```

Successful response:

```json
{"status":0,"token":"opaque-verification-token"}
```

Verify an OTP:

```http
POST /verifyotp
Content-Type: application/json

{"channelid":"test","token":"opaque-verification-token","otp":"123456"}
```

Successful response: `{"status":0}`. Tokens are deleted after successful verification, expiry, or the configured number of failed attempts.

| Status | Meaning |
| --- | --- |
| `0` | Success |
| `101` | Invalid channel |
| `102` | Missing user ID or token |
| `103` | Unknown user |
| `104` | Unknown token or channel mismatch |
| `401` | Incorrect OTP |
| `410` | Expired OTP |
| `500` | Push delivery failed |

## Configuration

```js
const createOtpService = require('./index.js');

createOtpService({
  port: 20003,
  otpTtlMs: 5 * 60 * 1000,
  maxAttempts: 3,
  channels: { login: {} },
  users: {
    alice: {
      contact_method: 'telegram',
      telegramuserid: '123456789'
    }
  },
  telegramToken: process.env.TELEGRAM_BOT_TOKEN
});
```

For Pushover, set `pushoverToken` and give the user a `pushoveruserid`. For another provider, inject a connector function or object:

```js
createOtpService({
  connectors: {
    sms: async ({ user, pin }) => sendSms(user.phone, `Your pin is ${pin}`),
    email: { async send({ user, pin }) { await sendEmail(user.email, pin); } }
  }
});
```

Use `listen: false` to obtain the Express app without opening a port. The return value is `{ app, lib, server }`.

## Test

```bash
npm test
```
