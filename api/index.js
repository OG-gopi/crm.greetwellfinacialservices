const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standalone ping endpoint that never fails
app.get('/api/ping', (req, res) => {
  res.json({ ping: 'pong', timestamp: new Date().toISOString() });
});

// Dynamic request delegation with full error diagnostic reporting
app.use((req, res, next) => {
  try {
    const backendApp = require('../backend/dist/app').default || require('../backend/dist/app');
    return backendApp(req, res, next);
  } catch (err) {
    console.error('Serverless Routing Exception:', err);
    return res.status(500).json({
      success: false,
      error: 'Serverless Exception',
      message: err.message,
      stack: err.stack,
      path: req.path
    });
  }
});

module.exports = app;
