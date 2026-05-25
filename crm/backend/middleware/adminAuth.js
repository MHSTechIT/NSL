const crypto          = require('crypto');
const { getPassword } = require('../utils/adminConfig');
const { verify }      = require('../utils/jwt');

/* Constant-time string compare (equal-length-safe). */
function constantTimeEqual(a, b) {
  const len   = Math.max(a.length, b.length);
  const aBuf  = Buffer.alloc(len);
  const bBuf  = Buffer.alloc(len);
  Buffer.from(a).copy(aBuf);
  Buffer.from(b).copy(bBuf);
  return crypto.timingSafeEqual(aBuf, bBuf) && a.length === b.length;
}

/* Guards every /api/admin/* route. A request is authorised if EITHER:
     • the bearer token is the super-admin password (full access), OR
     • the bearer token is a valid CRM-user JWT whose role is 'manager'
       (department-scoped), OR
     • the bearer token is a valid CRM-user JWT whose role is
       'team_leader' (team-scoped — narrower than the manager scope;
       see routes/admin.js, each endpoint adds a parallel WHERE
       team_leader_id = $1 when req.adminUser.kind === 'tl').
   Attaches req.adminUser so downstream routes can scope appropriately.
   Any other role, or an invalid token, → 401. */
function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  // 1. Super-admin — token equals the configured ADMIN_PASSWORD.
  const expected = getPassword();
  if (expected && constantTimeEqual(token, expected)) {
    req.adminUser = { kind: 'super' };
    return next();
  }

  // 2. Manager — a valid CRM-user JWT with role 'manager'.
  // 3. Team Leader — same, role 'team_leader'. Carries the same fields
  //    as the manager kind; the difference is interpreted per-route.
  try {
    const payload = verify(token);
    if (payload && payload.user_id) {
      if (payload.role === 'manager') {
        req.adminUser = {
          kind:       'manager',
          id:         payload.user_id,
          department: payload.department || null,
        };
        return next();
      }
      if (payload.role === 'team_leader') {
        req.adminUser = {
          kind:       'tl',
          id:         payload.user_id,
          department: payload.department || null,
        };
        return next();
      }
    }
  } catch (_) { /* not a valid JWT — fall through to 401 */ }

  return res.status(401).json({ error: 'unauthorized' });
}

module.exports = { adminAuth };
