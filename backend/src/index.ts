import { initSentry } from './config/sentry.js';
import app from './app.js';

// Initialize Sentry before app
initSentry();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
