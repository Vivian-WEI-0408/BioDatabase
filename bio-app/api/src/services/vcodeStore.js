const crypto = require('crypto');

const TTL_MS = 10 * 60 * 1000;
const store = new Map();

function create(email) {
  const code = crypto.randomInt(100000, 999999).toString();
  store.set(email, {
    code,
    expiresAt: Date.now() + TTL_MS,
  });
  return code;
}

function verify(email, code) {
  const entry = store.get(email);

  if (!entry) {
    return false;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }

  if (entry.code !== code) {
    return false;
  }

  store.delete(email);
  return true;
}

module.exports = {
  create,
  verify,
};
