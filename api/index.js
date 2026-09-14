let app;
let loadError = null;

try {
  app = require('../backend/dist/app').default;
} catch (err) {
  loadError = err;
  console.error('Vercel Lambda Top-Level Load Error:', err);
}

module.exports = (req, res) => {
  if (loadError || !app) {
    return res.status(500).json({
      success: false,
      error: 'Vercel Serverless Load Error',
      message: loadError ? loadError.message : 'Backend app could not be loaded',
      stack: loadError ? loadError.stack : undefined,
    });
  }

  try {
    return app(req, res);
  } catch (handlerErr) {
    console.error('Vercel Handler Execution Error:', handlerErr);
    return res.status(500).json({
      success: false,
      error: 'Vercel Serverless Execution Error',
      message: handlerErr ? handlerErr.message : 'Unknown handler error',
    });
  }
};
