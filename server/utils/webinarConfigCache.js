const TTL_MS = 5 * 60 * 1000; // 5 minutes

let cached = null;
let cachedAt = 0;

function get() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  return null;
}

function set(data) {
  cached = data;
  cachedAt = Date.now();
}

function invalidate() {
  cached = null;
  cachedAt = 0;
}

module.exports = { get, set, invalidate };
