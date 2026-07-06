require('dotenv').config();
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { connectDB } = require('./src/config/db');

const authRoutes = require('./src/routes/auth');
const roomRoutes = require('./src/routes/rooms');
const guestRoutes = require('./src/routes/guests');
const reservationRoutes = require('./src/routes/reservations');
const invoiceRoutes = require('./src/routes/invoices');
const reportRoutes = require('./src/routes/reports');
const staffRoutes = require('./src/routes/staff');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize CORS securely
app.use(cors({
  origin: 'https://vista-hotel.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());

app.use(express.json());

// Immediate Health Check
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Database Connection Middleware - Direct and safe invocation
app.use(async (req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failure context:", error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);

// Fallbacks
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Hotel Management API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

// Serverless Handler wrapper for Vercel deployment execution
const handler = serverless(app);
module.exports = handler;
module.exports.handler = handler;