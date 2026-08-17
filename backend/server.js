const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connection
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (Lightweight)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', require('./routes/reloadRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Dialog Reload API Service',
    timestamp: new Date().toISOString(),
    discountRules: {
      under5000: '15% Discount',
      overOrEqual5000: '40% Discount'
    }
  });
});

// Serve frontend static build if available
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all route for Single Page Application (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      // Fallback message if frontend isn't built yet
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="si">
        <head>
          <meta charset="UTF-8">
          <title>Dialog Reload API Server</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 12px; max-width: 500px; text-align: center; border: 1px solid #334155; }
            h1 { color: #f97316; margin-top: 0; }
            code { background: #0f172a; padding: 4px 8px; border-radius: 4px; color: #38bdf8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🚀 Dialog Reload Backend Active</h1>
            <p>API is running smoothly on port <code>${PORT}</code>.</p>
            <p>To view the full website, please build the frontend using <code>npm run build</code> or run frontend dev server.</p>
            <p><a href="/api/health" style="color:#38bdf8;">Check API Health Status</a></p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ Dialog Reload Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints: http://localhost:${PORT}/api/`);
  console.log(`🔐 Admin Routes:  http://localhost:${PORT}/api/admin/`);
  console.log(`💰 Discount Rules: < 5000 = 15% | >= 5000 = 40%`);
  console.log(`=======================================================`);

  // Start Native Baileys WhatsApp Engine
  const { startBaileys } = require('./services/baileysService');
  startBaileys().catch(err => console.warn('[Baileys Startup]', err.message));
});
