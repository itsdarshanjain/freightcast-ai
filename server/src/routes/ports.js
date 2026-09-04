import { Router } from 'express';
import { indianPorts, originPorts, routeDistances } from '../data/ports.js';

const router = Router();

// GET /api/ports — Get all Indian destination ports
router.get('/', (req, res) => {
  res.json({ success: true, data: indianPorts });
});

// GET /api/ports/origins — Get all origin (loading) ports
router.get('/origins', (req, res) => {
  res.json({ success: true, data: originPorts });
});

// GET /api/ports/:id — Get specific port details
router.get('/:id', (req, res) => {
  const port = indianPorts.find(p => p.id === req.params.id)
    || originPorts.find(p => p.id === req.params.id);
  if (!port) return res.status(404).json({ success: false, error: 'Port not found' });
  res.json({ success: true, data: port });
});

// GET /api/ports/distance/:originId/:destId — Get sailing distance
router.get('/distance/:originId/:destId', (req, res) => {
  const key = `${req.params.originId}-${req.params.destId}`;
  const distance = routeDistances[key];
  if (!distance) return res.status(404).json({ success: false, error: 'Route not found' });

  const origin = originPorts.find(p => p.id === req.params.originId);
  const dest = indianPorts.find(p => p.id === req.params.destId);

  // Calculate approximate sailing times for each vessel type
  const sailingTimes = {
    handysize: +(distance / (13 * 24)).toFixed(1),
    supramax: +(distance / (14 * 24)).toFixed(1),
    panamax: +(distance / (14 * 24)).toFixed(1),
    capesize: +(distance / (14.5 * 24)).toFixed(1),
  };

  res.json({
    success: true,
    data: {
      origin: origin?.name,
      destination: dest?.name,
      distanceNM: distance,
      distanceKM: Math.round(distance * 1.852),
      sailingTimes,
    },
  });
});

// GET /api/ports/compatible/:destId — Get vessel types compatible with a destination port
router.get('/compatible/:destId', (req, res) => {
  const port = indianPorts.find(p => p.id === req.params.destId);
  if (!port) return res.status(404).json({ success: false, error: 'Port not found' });

  const compatible = [];
  const incompatible = [];

  // Check vessel compatibility based on draft and LOA
  const checks = [
    { id: 'handysize', name: 'Handysize', maxDraft: 10.5, maxLOA: 200 },
    { id: 'supramax', name: 'Supramax', maxDraft: 13.5, maxLOA: 200 },
    { id: 'panamax', name: 'Panamax', maxDraft: 14.5, maxLOA: 229 },
    { id: 'capesize', name: 'Capesize', maxDraft: 18.2, maxLOA: 300 },
  ];

  for (const vessel of checks) {
    if (port.maxDraft === null) {
      incompatible.push({ ...vessel, reason: 'Anchorage only — no berth available' });
    } else if (vessel.maxDraft > port.maxDraft) {
      incompatible.push({ ...vessel, reason: `Draft ${vessel.maxDraft}m exceeds port limit ${port.maxDraft}m` });
    } else if (port.maxLOA && vessel.maxLOA > port.maxLOA) {
      incompatible.push({ ...vessel, reason: `LOA ${vessel.maxLOA}m exceeds port limit ${port.maxLOA}m` });
    } else {
      compatible.push(vessel);
    }
  }

  res.json({ success: true, data: { port: port.name, compatible, incompatible } });
});

export default router;
