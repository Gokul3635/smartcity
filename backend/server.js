require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const announcementsRoutes = require('./routes/announcements');
const workersRoutes = require('./routes/workers');
const egovRoutes = require('./routes/egov');
const utilitiesRoutes = require('./routes/utilities');
const transportRoutes = require('./routes/transport');
const emergencyRoutes = require('./routes/emergency');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Smart City API is running',
    healthCheck: '/api/health',
    endpoints: {
      auth: '/api/auth',
      complaints: '/api/complaints',
      announcements: '/api/announcements',
      workers: '/api/workers',
      egov: '/api/egov',
      utilities: '/api/utilities',
      transport: '/api/transport',
      emergency: '/api/emergency',
      analytics: '/api/analytics'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart City API is running' });
});

app.post('/api/deploy', (req, res) => {
  if (process.env.VERCEL) {
    return res.status(403).json({ error: 'Deployments cannot be triggered from production Vercel environment' });
  }

  const projectRoot = path.join(__dirname, '..');

  // Use npx.cmd on Windows for compatibility; --yes skips all interactive prompts
  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';
  const deployCommand = `${npxCmd} vercel --prod --yes`;

  console.log('[Deploy] Triggering Vercel deployment from:', projectRoot);

  // 3-minute timeout — Vercel deployments typically take 30-90s
  exec(deployCommand, { cwd: projectRoot, timeout: 3 * 60 * 1000 }, (deployError, deployStdout, deployStderr) => {
    if (deployError) {
      const errDetail = deployStderr || deployError.message || 'Unknown error';
      console.error('[Deploy] Vercel deployment failed:', errDetail);
      return res.status(500).json({
        error: 'Vercel deployment failed',
        details: errDetail,
        stdout: deployStdout || ''
      });
    }

    console.log('[Deploy] Vercel deployment completed successfully.');
    console.log('[Deploy] Output:', deployStdout);

    // Extract the deployment URL from vercel output
    const urlMatch = deployStdout.match(/https:\/\/[^\s]+\.vercel\.app/);
    const deployUrl = urlMatch ? urlMatch[0] : null;

    res.json({
      success: true,
      message: 'Application successfully deployed to Vercel!',
      deployUrl,
      output: deployStdout
    });
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/egov', egovRoutes);
app.use('/api/utilities', utilitiesRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/analytics', analyticsRoutes);

const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Smart City API running on http://localhost:${PORT}`);
  });
}

module.exports = app;

