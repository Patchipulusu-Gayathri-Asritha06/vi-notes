import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';

dotenv.config();

const app = express();

// Render assigns a PORT environment variable automatically
const PORT = process.env.PORT || 5000;

// Allow requests from your frontend URL
// On Render, set FRONTEND_URL environment variable to your frontend service URL
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check — Render uses this to verify service is running
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Vi-Notes API is running' });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vi-notes';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

export default app;