const pool = require('../db');

const PREFIX_BY_SOURCE = { meta: 'AWS-', yt: 'YT-' };
const START = 101;

function prefixFor(source) {
  return PREFIX_BY_SOURCE[source] || 'AWS-';
}

// Per-source name space so Meta and YT can't ever produce duplicate names
// (e.g. both starting at AWS-101). Meta keeps 'AWS-N', YT uses 'YT-N'.
async function nextWebinarName(source = 'meta') {
  const prefix = prefixFor(source);
  const numRegex   = `${prefix}(\\d+)`;        // capture group for SUBSTRING
  const matchRegex = `^${prefix}\\d+$`;        // ~ regex match

  const { rows } = await pool.query(
    `SELECT COALESCE(
       MAX((substring(name FROM $3))::int),
       $1 - 1
     ) AS max_num
     FROM webinars
     WHERE name ~ $4 AND source = $2`,
    [START, source, numRegex, matchRegex]
  );
  const next = (rows[0]?.max_num ?? START - 1) + 1;
  return `${prefix}${next}`;
}

// "Next Webinar" — always one past the HIGHEST webinar number that already
// exists for this source, so codes only ever increase (101,102,103,…199).
// Deriving it from the active webinar's number breaks ordering whenever an
// inactive webinar with a higher number exists, which mints a duplicate.
async function nextUpcomingWebinarName(source = 'meta') {
  return nextWebinarName(source);
}

module.exports = { nextWebinarName, nextUpcomingWebinarName };
