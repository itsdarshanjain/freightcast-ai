import { Router } from 'express';
import { vesselTypes } from '../data/vessels.js';

const router = Router();

// GET /api/vessels — Get all vessel types
router.get('/', (req, res) => {
  res.json({ success: true, data: vesselTypes });
});

// GET /api/vessels/:id — Get specific vessel type
router.get('/:id', (req, res) => {
  const vessel = vesselTypes.find(v => v.id === req.params.id);
  if (!vessel) return res.status(404).json({ success: false, error: 'Vessel type not found' });
  res.json({ success: true, data: vessel });
});

export default router;
