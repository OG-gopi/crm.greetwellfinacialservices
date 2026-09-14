let app: any;
let loadError: any = null;

try {
  // Lazily require backend Express app so top-level load errors can be captured cleanly
  app = require('../backend/src/app').default;
} catch (err: any) {
  loadError = err;
  console.error('Vercel Lambda Top-Level Load Error:', err);
}

export default function handler(req: any, res: any) {
  if (loadError || !app) {
    return res.status(500).json({
      success: false,
      error: 'Vercel Lambda Cold Start Error',
      message: loadError ? (loadError.message || String(loadError)) : 'Express app is not initialized',
      stack: loadError ? loadError.stack : undefined,
    });
  }

  return app(req, res);
}
