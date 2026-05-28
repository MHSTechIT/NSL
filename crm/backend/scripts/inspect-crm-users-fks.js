/* One-shot: list every foreign key referencing crm_users.id, plus
   whether it has ON DELETE CASCADE / SET NULL or NO ACTION (the latter
   blocks deletion when any referencing row exists). */
require('dotenv').config();
const pool = require('../db');

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT tc.table_name AS referencing_table,
             kcu.column_name AS referencing_column,
             rc.delete_rule  AS on_delete
        FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc
          ON tc.constraint_name = rc.constraint_name
         AND tc.constraint_schema = rc.constraint_schema
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name
         AND kcu.constraint_schema = tc.constraint_schema
       WHERE rc.unique_constraint_name IN (
              SELECT constraint_name FROM information_schema.table_constraints
               WHERE table_name = 'crm_users' AND constraint_type = 'PRIMARY KEY'
             )
       ORDER BY tc.table_name, kcu.column_name
    `);
    console.log('\nForeign keys referencing crm_users.id:\n');
    for (const r of rows) {
      console.log(`  ${r.referencing_table}.${r.referencing_column}  →  ON DELETE ${r.on_delete}`);
    }
    if (rows.length === 0) console.log('  (none found)');
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
