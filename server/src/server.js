import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import freightRoutes from './routes/freight.js';
import portRoutes from './routes/ports.js';
import forecastRoutes from './routes/forecast.js';
import vesselRoutes from './routes/vessels.js';
import alertRoutes from './routes/alerts.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/freight', freightRoutes);
app.use('/api/ports', portRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'FreightCast AI — Team Prakalp' });
});

// Serve React frontend in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all: send React's index.html for any non-API route (supports React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Start server anyway for demo — will use seed data
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (no DB)`);
    });
  }
};

startServer();
