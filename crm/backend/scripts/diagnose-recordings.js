/* One-shot: diagnose why admin recording playback shows 0:00/0:00.
   Reads the most recent 10 calls that have a recording_url set, prints
   each one's stored URL + whether the file exists on disk (for local
   /uploads/ paths) + the file size. Helps pinpoint:
     - URLs that point at non-existent files
     - Files that exist but are 0 bytes (failed downloads)
     - URLs still pointing at expired Smartflo signed URLs
*/

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('../db');

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.recording_url, c.duration_sec, c.started_at,
             c.caller_id, u.full_name AS caller_name
        FROM calls c
        LEFT JOIN crm_users u ON u.id = c.caller_id
       WHERE c.recording_url IS NOT NULL
         AND c.recording_url <> ''
       ORDER BY c.started_at DESC
       LIMIT 10
    `);

    console.log(`\nFound ${rows.length} call(s) with a recording_url.\n`);
    if (rows.length === 0) {
      console.log('No recordings on file. Either no calls have completed with PCA, or the recording_url column never gets populated.');
      return;
    }

    for (const r of rows) {
      console.log(`── call_id: ${r.id}`);
      console.log(`     caller: ${r.caller_name || '(unknown)'} (${r.caller_id || 'null'})`);
      console.log(`     duration: ${r.duration_sec || 0}s`);
      console.log(`     started: ${r.started_at}`);
      console.log(`     recording_url: ${r.recording_url}`);

      if (r.recording_url.startsWith('/uploads/')) {
        const safe = path.normalize(r.recording_url).replace(/^[\\/]+/, '');
        const abs  = path.join(__dirname, '..', safe);
        if (fs.existsSync(abs)) {
          const stat = fs.statSync(abs);
          console.log(`     LOCAL FILE: ${abs}`);
          console.log(`     size: ${stat.size} bytes  (${stat.size === 0 ? 'ZERO BYTES — broken download' : 'ok'})`);
        } else {
          console.log(`     LOCAL FILE: ${abs}`);
          console.log(`     ✗ MISSING — DB says file exists but it's not on disk`);
        }
      } else if (r.recording_url.startsWith('http')) {
        console.log(`     REMOTE URL — proxy will fetch on demand`);
        // Test fetch with HEAD to see if Smartflo still serves it
        try {
          const res = await fetch(r.recording_url, { method: 'HEAD', redirect: 'follow' });
          console.log(`     HEAD status: ${res.status}  content-length: ${res.headers.get('content-length') || '?'}`);
        } catch (e) {
          console.log(`     HEAD fetch failed: ${e.message}`);
        }
      } else {
        console.log(`     ⚠ unrecognized URL shape`);
      }
      console.log('');
    }
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
