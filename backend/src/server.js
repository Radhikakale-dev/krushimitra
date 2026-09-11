/**
 * server.js
 * KrushiMitra AI — Entry point
 * IMPORTANT: dotenv MUST be loaded before any other imports so that
 * process.env variables (like OPENAI_API_KEY) are available during module init.
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig(); // ← Must run first, before app.js loads OpenAI / other env-dependent code

import app from './app.js';
import connectDB from './config/db.js';

// Connect to MongoDB Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
