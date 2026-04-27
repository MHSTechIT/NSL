require('dotenv').config();

/* Prevent unhandled errors from crashing the server */
process.on('uncaughtException',  err => console.error('Uncaught:', err.message));
process.on('unhandledRejection', err => console.error('Unhandled rejection:', err?.message || err));
const express = require('express');
const cors = require('cors');

const webinarConfigRouter = require('./routes/webinarConfig');
const leadsRouter = require('./routes/leads');
const adminRouter = require('./routes/admin');
const authRouter  = require('./routes/auth');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api', webinarConfigRouter);
app.use('/api', leadsRouter);
app.use('/api/auth', authRouter);   /* public: forgot-password, reset-password */
app.use('/api/admin', adminRouter); /* protected: requires Bearer token */

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MHS server running on port ${PORT}`));
