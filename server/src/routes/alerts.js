import { Router } from 'express';

const router = Router();

// Research-backed alerts — CAG Report, Red Sea, Haldia, Capesize, Cyclone, Demurrage, Coal price, COA opportunity
const generateAlerts = () => [
  {
    id: 'alert-001',
    type: 'MARKET_SPIKE',
    severity: 'high',
    title: 'BDI at 3-Year High — Capesize $54,750/day',
    message: 'BDI hit 3,628 — highest since 2023. Capesize spot rates at $54,750/day driven by tight Pacific tonnage and Chinese iron ore restocking. Q4 seasonal surge expected to push further. SAIL paying maximum freight on spot contracts.',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    affectedRoutes: ['Newcastle → Paradip', 'Newcastle → Gangavaram'],
    actionRequired: true,
  },
  {
    id: 'alert-002',
    type: 'GEOPOLITICAL',
    severity: 'high',
    title: '🌊 Red Sea / Suez Canal — DISRUPTED',
    message: 'Houthi attacks ongoing since Nov 2023. All US-origin coal (Hampton Roads) rerouted via Cape of Good Hope — +14 days transit, +$350,000-$500,000 per voyage. Annual SAIL impact: ~Rs. 163 crore if 20% procurement from US.',
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
    affectedRoutes: ['Hampton Roads → Paradip', 'Hampton Roads → Vizag'],
    actionRequired: true,
  },
  {
    id: 'alert-003',
    type: 'PORT_CONSTRAINT',
    severity: 'high',
    title: '⚓ Haldia Draft Restriction — 10.5m MAX',
    message: 'Hooghly river draft at 10.5m. Only Handysize (10m draft) and Supramax (12.8m with partial load) can enter. Panamax & Capesize REJECTED. TRT 72 hours — demurrage probability 72%. Use Sagar-Sandheads for lightering.',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    affectedRoutes: ['All routes → Haldia'],
    actionRequired: true,
  },
  {
    id: 'alert-004',
    type: 'WEATHER',
    severity: 'medium',
    title: '🌀 Bay of Bengal — Cyclone Season Peak (Oct-Dec)',
    message: 'Cyclone probability reaches 55-60% for Paradip, Vizag, and Dhamra in October-December. Historically causes 2-5 day port closures. Paradip most vulnerable — Mahanadi River confluence.',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    affectedRoutes: ['All → Paradip', 'All → Vizag', 'All → Dhamra'],
    actionRequired: true,
  },
  {
    id: 'alert-005',
    type: 'DEMURRAGE_RISK',
    severity: 'medium',
    title: '⏱️ Vizag Inner TRT Above National Average',
    message: 'Vizag Inner Harbour TRT: 65.9 hours vs national average 49.5 hours (MoPSW FY24). Demurrage probability: 64% for Panamax. Consider Vizag Outer (VGCB, 18.1m draft) or Gangavaram (20.2m, private port, <48h TRT).',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    affectedRoutes: ['All → Vizag Inner'],
    actionRequired: true,
  },
  {
    id: 'alert-006',
    type: 'CAG_AUDIT',
    severity: 'high',
    title: '📋 CAG Report No. 10 of 2025 — Procurement Alert',
    message: 'CAG flagged Rs. 2,539.68 crore excess expenditure on imported coal at SAIL (2016-2023). Also flagged 9.32 lakh tonnes hot metal production loss (Rs. 1,231 crore potential revenue). Root cause: no predictive procurement model. FreightCast AI directly addresses these findings.',
    timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
    affectedRoutes: ['SAIL-wide procurement'],
    actionRequired: true,
  },
  {
    id: 'alert-007',
    type: 'FUEL_PRICE',
    severity: 'medium',
    title: '⛽ VLSFO Bunker at $850/ton (Singapore)',
    message: 'VLSFO bunker fuel at $850/ton — Brent crude holding at $82/bbl. Fuel now constitutes 30%+ of total voyage cost. Capesize fuel: $46,750/day laden. Consider slow-steaming (13 knots) to cut fuel consumption ~12%.',
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    affectedRoutes: ['All long-haul routes'],
    actionRequired: false,
  },
  {
    id: 'alert-008',
    type: 'FAVORABLE_MARKET',
    severity: 'low',
    title: '🟢 Mozambique Route — Zero Red Sea Risk',
    message: 'Maputo (ICVL mines, SAIL subsidiary) → Paradip: 4,200 NM via direct Indian Ocean. No Red Sea exposure. SAIL owns Minas de Benga mine — predictable baseload supply. Recommend increasing ICVL/Mozambique allocation from 10% to 15%.',
    timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
    affectedRoutes: ['Maputo → Paradip', 'Maputo → Vizag'],
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
