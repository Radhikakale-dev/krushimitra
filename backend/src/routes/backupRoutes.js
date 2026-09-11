import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const backupRouter = express.Router();

// Only Admins can access backup/restore
backupRouter.use(protect);
backupRouter.use(authorize('admin'));

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/backup
// @desc    Download full database backup as JSON
// ─────────────────────────────────────────────────────────────────────────────
backupRouter.get('/', asyncHandler(async (req, res) => {
  const models = mongoose.modelNames();
  const backupData = {};

  for (let m of models) {
    const Model = mongoose.model(m);
    backupData[m] = await Model.find({}).lean();
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="krushimitra_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(backupData, null, 2));
}));

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/backup/restore
// @desc    Restore database from JSON file
// ─────────────────────────────────────────────────────────────────────────────
backupRouter.post('/restore', express.json({ limit: '50mb' }), asyncHandler(async (req, res) => {
  const backupData = req.body;

  if (!backupData || typeof backupData !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid backup payload' });
  }

  const models = mongoose.modelNames();
  
  // Start a session for safe restore
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (let m of models) {
      if (backupData[m] && Array.isArray(backupData[m])) {
        const Model = mongoose.model(m);
        // Clear existing collection
        await Model.deleteMany({}, { session });
        
        // Insert backup data
        if (backupData[m].length > 0) {
          // Schema casts strings back to ObjectIds and Dates
          await Model.insertMany(backupData[m], { session });
        }
      }
    }

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error('Restore failed: ' + error.message);
  }
}));
