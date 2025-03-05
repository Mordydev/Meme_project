import express from 'express';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;