import { Router } from 'express';

const router = Router();

// Simulated real-time alerts
const generateAlerts = () => [
  {
    id: 'alert-001',
    type: 'MARKET_SPIKE',
    severity: 'high',
    title: 'BDI Spike Alert — Capesize Segment',
    message: 'Capesize rates surged 8.2% in the last 48 hours due to increased Chinese iron ore demand. Consider delaying Capesize charters for 5-7 days.',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    affectedRoutes: ['Australia → Paradip', 'Australia → Vizag'],
    actionRequired: true,
  },
  {
    id: 'alert-002',
    type: 'PORT_CONGESTION',
    severity: 'medium',
    title: 'Port Congestion — Paradip',
    message: 'Vessel queue at Paradip has increased to 12 ships. Expected wait time: 4.5 days. Consider diverting to Dhamra (3-day shorter queue).',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    affectedRoutes: ['All routes to Paradip'],
    actionRequired: true,
  },
  {
    id: 'alert-003',
    type: 'WEATHER',
    severity: 'high',
    title: 'Cyclone Watch — Bay of Bengal',
    message: 'IMD has issued a cyclone watch for the Bay of Bengal. Vessels in transit to East Coast ports may face delays of 2-3 days. Activate contingency routes.',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    affectedRoutes: ['All East Coast destinations'],
    actionRequired: true,
  },
  {
    id: 'alert-004',
    type: 'FAVORABLE_MARKET',
    severity: 'low',
    title: 'Favorable Entry Window — Supramax',
    message: 'Supramax spot rates are 7% below the 30-day average. This is an optimal window for Indonesia → Vizag charter bookings.',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    affectedRoutes: ['Indonesia → Vizag', 'Indonesia → Gangavaram'],
    actionRequired: false,
  },
  {
    id: 'alert-005',
    type: 'DEMURRAGE_RISK',
    severity: 'medium',
    title: 'Demurrage Risk — Haldia',
    message: 'Tidal window at Haldia is narrow this week. Supramax vessels may incur 1.5 extra days of waiting. Estimated demurrage: $18,000/day.',
    timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
    affectedRoutes: ['All routes to Haldia'],
    actionRequired: true,
  },
  {
    id: 'alert-006',
    type: 'COAL_PRICE',
    severity: 'low',
    title: 'Coal Price Drop — Newcastle Benchmark',
    message: 'Newcastle benchmark coal price dropped 4.3% to $218/ton. Combined with lower freight rates, this creates a procurement opportunity.',
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    affectedRoutes: ['Australia → All Indian ports'],
    actionRequired: false,
  },
];

// GET /api/alerts — Get all active alerts
router.get('/', (req, res) => {
  const alerts = generateAlerts();
  const { severity } = req.query;
  const filtered = severity ? alerts.filter(a => a.severity === severity) : alerts;

  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
});

// GET /api/alerts/summary — Alert summary counts
router.get('/summary', (req, res) => {
  const alerts = generateAlerts();
  res.json({
    success: true,
    data: {
      total: alerts.length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      actionRequired: alerts.filter(a => a.actionRequired).length,
    },
  });
});

export default router;
