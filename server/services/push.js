let http2 = require('http2');
let fs = require('fs');
let jwt = require('jsonwebtoken');
let DeviceToken = require('../models/DeviceToken');
let Group = require('../models/Group');

let cachedProviderToken = null;
let cachedAt = 0;
let PROVIDER_TOKEN_TTL_MS = 50 * 60 * 1000;

function apnsConfigured() {
  return Boolean(process.env.APNS_KEY_PATH && process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_BUNDLE_ID);
}

function getProviderToken() {
  let now = Date.now();
  if (cachedProviderToken && now - cachedAt < PROVIDER_TOKEN_TTL_MS) return cachedProviderToken;

  let privateKey = fs.readFileSync(process.env.APNS_KEY_PATH, 'utf8');
  cachedProviderToken = jwt.sign(
    { iss: process.env.APNS_TEAM_ID, iat: Math.floor(now / 1000) },
    privateKey,
    { algorithm: 'ES256', keyid: process.env.APNS_KEY_ID }
  );
  cachedAt = now;
  return cachedProviderToken;
}

function apnsHost() {
  return process.env.APNS_ENV === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
}

function sendApnsPush(deviceToken, { title, body }) {
  return new Promise((resolve, reject) => {
    let client = http2.connect(`https://${apnsHost()}`);
    client.on('error', reject);

    let payload = JSON.stringify({ aps: { alert: { title, body }, sound: 'default' } });
    let req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${getProviderToken()}`,
      'apns-topic': process.env.APNS_BUNDLE_ID,
      'apns-push-type': 'alert',
    });

    let status;
    let data = '';
    req.on('response', (headers) => { status = headers[':status']; });
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      client.close();
      if (status >= 200 && status < 300) resolve();
      else reject(new Error(`APNs ${status}: ${data}`));
    });
    req.on('error', (err) => { client.close(); reject(err); });

    req.end(payload);
  });
}

async function notifyGroup(groupId, { type, title, body, excludeUserId }) {
  let group = await Group.findById(groupId);
  if (!group) return;

  let recipientIds = group.members
    .map((m) => m.toString())
    .filter((id) => id !== String(excludeUserId));
  if (!recipientIds.length) return;

  let tokens = await DeviceToken.find({ userId: { $in: recipientIds } });
  if (!tokens.length) {
    console.log(`[push:${type}] ${title} — ${body} (no registered devices yet)`);
    return;
  }

  if (!apnsConfigured()) {
    tokens.forEach((t) => {
      console.log(`[push:${type}] -> device ${t.token.slice(0, 8)}…: ${title} — ${body} (APNs not configured, logging only)`);
    });
    return;
  }

  await Promise.all(tokens.map(async (t) => {
    try {
      await sendApnsPush(t.token, { title, body });
      console.log(`[push:${type}] sent to device ${t.token.slice(0, 8)}…`);
    } catch (err) {
      console.error(`[push:${type}] failed for device ${t.token.slice(0, 8)}…:`, err.message);
    }
  }));
}

module.exports = { notifyGroup };
