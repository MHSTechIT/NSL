require('dotenv').config();

/* Prevent unhandled errors from crashing the server */
process.on('uncaughtException',  err => console.error('Uncaught:', err.message));
process.on('unhandledRejection', err => console.error('Unhandled rejection:', err?.message || err));

const app = require('./app');
const { startLinkSwapScheduler } = require('./utils/linkSwapScheduler');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MHS server running on port ${PORT}`);
  startLinkSwapScheduler();
});
