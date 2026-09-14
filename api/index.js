let app;
let initError = null;

try {
  app = require('../backend/dist/app').default;
} catch (err) {
  initError = err;
  console.error('Failed to initialize Express app in Vercel serverless handler:', err);
}

module.exports = (req, res) => {
  if (initError || !app) {
    return res.status(500).json({
      success: false,
      error: 'Vercel Serverless Initialization Error',
      message: initError ? initError.message : 'App failed to load',
    });
  }
  return app(req, res);
};
