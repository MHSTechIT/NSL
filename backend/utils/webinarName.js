const pool = require('../db');

const PREFIX = 'AWS-';
const START = 101;

// Per-source name space: Meta and YT each have their own AWS-N counter so
// the two pipelines stay independent.
async function nextWebinarName(source = 'meta') {
  const { rows } = await pool.query(
    `SELECT COALESCE(
       MAX((substring(name FROM 'AWS-(\\d+)'))::int),
       $1 - 1
     ) AS max_num
     FROM webinars
     WHERE name ~ '^AWS-\\d+$' AND source = $2`,
    [START, source]
  );
  const next = (rows[0]?.max_num ?? START - 1) + 1;
  return `${PREFIX}${next}`;
}

// The "Next Webinar" slot is always (current active webinar number) + 1.
// e.g. Current AWS-103 → Next AWS-104. Falls back to the source's max + 1 only
// when no active webinar exists for that source.
async function nextUpcomingWebinarName(source = 'meta') {
  const { rows } = await pool.query(
    `SELECT (substring(name FROM 'AWS-(\\d+)'))::int AS num
       FROM webinars
      WHERE is_active = TRUE AND name ~ '^AWS-\\d+$' AND source = $1
      ORDER BY num DESC LIMIT 1`,
    [source]
  );
  const activeNum = rows[0]?.num;
  if (typeof activeNum === 'number') return `${PREFIX}${activeNum + 1}`;
  return nextWebinarName(source);
}

module.exports = { nextWebinarName, nextUpcomingWebinarName };
