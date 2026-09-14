const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

let backendApp = null;

try {
  const distAppPath = path.resolve(__dirname, '../backend/dist/app');
  if (fs.existsSync(distAppPath + '.js') || fs.existsSync(distAppPath)) {
    backendApp = require('../backend/dist/app').default || require('../backend/dist/app');
  } else {
    require('ts-node/register');
    backendApp = require('../backend/src/app').default || require('../backend/src/app');
  }
} catch (err) {
  console.error('Failed to load backend dist/app:', err);
  try {
    require('ts-node/register');
    backendApp = require('../backend/src/app').default || require('../backend/src/app');
  } catch (err2) {
    console.error('Failed to load backend src/app:', err2);
  }
}

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'CRM API Serverless Function is healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'CRM API Serverless Function is healthy' });
});

if (backendApp) {
  app.use(backendApp);
} else {
  app.use((req, res) => {
    res.status(500).json({ error: 'Backend App Initialization Error', message: 'Could not load backend routes' });
  });
}

module.exports = app;
