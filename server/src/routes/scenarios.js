// ============================================================
// FREIGHTCAST AI — SCENARIOS (WHAT-IF) ROUTE v2.0
// 5 preset scenarios + custom simulation
// Team Prakalp | SIH 2026
// ============================================================
import express from 'express';

const router = express.Router();

const BASE_BDI = 3628;
const USD_TO_INR_CRORE = 83.5 / 1e7;

const PRESET_SCENARIOS = [
  {
    id: 'red-sea-closure',
    name: 'Red Sea Disruption',
    emoji: '🌊',
    severity: 'high',
    isActive: true,
    description: 'Suez Canal/Red Sea disruption forces US-origin coal via Cape of Good Hope (+14 days)',
    defaultParams: { affectedOrigin: 'hampton-roads', extraDays: 14, costMultiplier: 1.35 },
    impact: {
      extraDays: 14,
      extraCostPerVoyageUSD: 450000,
      annualSAILImpactCrore: 163,
      affectedRoutes: ['Hampton Roads → Paradip', 'Mobile → Vizag'],
      safeRoutes: ['Newcastle → Paradip (SAFE)', 'Maputo → Vizag (SAFE)', 'Vostochny → Paradip (SAFE)'],
      recommendation: '🟢 Shift US coal quota to Australia or Russia immediately. No Red Sea exposure on those routes.'
    }
  },
  {
    id: 'bdi-spike',
    name: 'BDI Spikes +30%',
    emoji: '📈',
    severity: 'high',
    isActive: false,
    description: 'BDI rises from 3,628 to ~4,716 — possible Q4 surge or fleet shortage',
    defaultParams: { bdiFactor: 1.30 },
    impact: {
      newBDI: Math.round(BASE_BDI * 1.30),
      panamax_rate_new: Math.round(20850 * 1.30),
      extraCostPerVoyageUSD: Math.round(20850 * 0.30 * 32),
      annualSAILImpactCrore: Math.round(20850 * 0.30 * 32 * 200 * 83.5 / 1e7),
      recommendation: '🔴 Lock 12-month Time Charter TODAY at current $20,850/day. Every week delay = higher exposure.'
    }
  },
  {
    id: 'paradip-congested',
    name: 'Paradip Port Congested',
    emoji: '⚓',
    severity: 'medium',
    isActive: false,
    description: 'Paradip experiences 5-day average wait time (cyclone/monsoon season)',
    defaultParams: { port: 'paradip', extraWaitDays: 5 },
    impact: {
      extraWaitDays: 5,
      demurragePanamax: 100000,   // $20,000/day x 5 days
      demurrageCapesizeUSD: 125000, // $25,000/day x 5 days
      annualSAILImpactCrore: Math.round(100000 * 40 * 83.5 / 1e7), // 40 voyages/year
      recommendation: '🟡 Reroute to Gangavaram (20.2m draft, TRT 46hrs, lowest congestion 18%). Or negotiate laytime extension.'
    }
  },
  {
    id: 'fuel-spike',
    name: 'Fuel Price +$150/ton',
    emoji: '⛽',
    severity: 'medium',
    isActive: false,
    description: 'VLSFO bunker price rises from $850 to $1,000/ton (Brent crude surge)',
    defaultParams: { fuelPriceNew: 1000, fuelPriceOld: 850 },
    impact: {
      extraFuelCostPanamax: Math.round(32 * 17 * 150),    // 32t/day x 17 sailing days x $150
      extraFuelCostCapesize: Math.round(55 * 17 * 150),
      panamax_advice: 'Panamax fuel cost +$81,600/voyage. Consider Capesize for economy of scale.',
      capesize_advantage: 'At $1,000/ton fuel, Capesize per-ton fuel cost IMPROVES relative to Panamax due to higher DWT',
      recommendation: '🟡 Upgrade to Capesize at Gangavaram for large parcels. Supramax for short Indonesia route — lowest absolute fuel cost.'
    }
  },
  {
    id: 'spot-to-coa',
    name: 'Switch from Spot to COA Mix',
    emoji: '📋',
    severity: 'low',
    isActive: false,
    description: 'Model the annual savings of moving from 100% spot to optimized contract mix',
    defaultParams: { annualMT: 16300000, currentBDI: 3628 },
    impact: {
      spotAnnualCostCrore: Math.round(16300000 * (3628 / 120) * 83.5 / 1e7),
      optimizedCostCrore: Math.round(16300000 * (3628 / 140) * 83.5 / 1e7),
      savingsCrore: Math.round(16300000 * (3628 / 120 - 3628 / 140) * 83.5 / 1e7),
      contractMix: '40% TC-12m + 35% COA-6m + 25% Spot',
      cagNote: 'Directly addresses CAG Report No. 10 of 2025 findings (Rs 2,539 Cr excess expenditure)',
      recommendation: '🟢 Implement COA mix immediately. Estimated annual savings: Rs 440-520 Crore vs all-spot strategy.'
    }
  }
];

// GET /api/scenarios/presets
router.get('/presets', (req, res) => {
  res.json({ scenarios: PRESET_SCENARIOS });
});

// POST /api/scenarios/simulate
router.post('/simulate', (req, res) => {
  try {
    const { scenarioId, customParams } = req.body;
    const scenario = PRESET_SCENARIOS.find(s => s.id === scenarioId);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found', available: PRESET_SCENARIOS.map(s => s.id) });
    }

    // Merge default params with custom
    const params = { ...scenario.defaultParams, ...customParams };

    // Calculate dynamic impact based on params
    let dynamicImpact = { ...scenario.impact };

    if (scenarioId === 'bdi-spike' && params.bdiFactor) {
      const newBDI = Math.round(BASE_BDI * params.bdiFactor);
      const increase = params.bdiFactor - 1;
      dynamicImpact = {
        ...dynamicImpact,
        newBDI,
        panamax_rate_new: Math.round(20850 * params.bdiFactor),
        extraCostPerVoyageUSD: Math.round(20850 * increase * 32),
        bdiIncreasePct: Math.round(increase * 100)
      };
    }

    if (scenarioId === 'paradip-congested' && params.extraWaitDays) {
      dynamicImpact = {
        ...dynamicImpact,
        demurragePanamax: params.extraWaitDays * 20000,
        demurrageCapesize: params.extraWaitDays * 25000,
        extraWaitDays: params.extraWaitDays
      };
    }

    if (scenarioId === 'fuel-spike' && params.fuelPriceNew) {
      const priceDiff = params.fuelPriceNew - (params.fuelPriceOld || 850);
      dynamicImpact = {
        ...dynamicImpact,
        extraFuelCostPanamax: Math.round(32 * 17 * priceDiff),
        extraFuelCostCapesize: Math.round(55 * 17 * priceDiff),
        priceDiff
      };
    }

    res.json({
      scenario: { ...scenario, impact: dynamicImpact },
      params,
      simulatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scenarios/demurrage — Demurrage risk calculator
router.get('/demurrage', (req, res) => {
  try {
    const { portId = 'paradip', vesselType = 'panamax', season = 'normal', laytimeDays = 3 } = req.query;

    const DEMURRAGE_RATES = {
      handysize: 10000, supramax: 15000, panamax: 20000, capesize: 25000
    };

    const PORT_RISKS = {
      'paradip':     { baseProb: 0.22, trt: 41.6, label: 'Efficient' },
      'vizag-inner': { baseProb: 0.48, trt: 65.9, label: 'Slow (above avg)' },
      'vizag-outer': { baseProb: 0.35, trt: 55.0, label: 'Moderate' },
      'gangavaram':  { baseProb: 0.12, trt: 46.0, label: 'Very Efficient (private)' },
      'dhamra':      { baseProb: 0.18, trt: 48.0, label: 'Efficient (private)' },
      'haldia':      { baseProb: 0.72, trt: 72.0, label: 'High Risk (river/tidal)' },
      'gopalpur':    { baseProb: 0.38, trt: 60.0, label: 'Moderate' }
    };

    const SEASON_MULT = {
      normal: 1.0, q4: 1.25, monsoon: 1.45, cyclone: 3.00, jan: 0.90, feb: 0.90
    };

    const port = PORT_RISKS[portId] || PORT_RISKS['paradip'];
    const seasonMult = SEASON_MULT[season] || 1.0;
    const probability = Math.min(0.98, port.baseProb * seasonMult);
    const dailyRate = DEMURRAGE_RATES[vesselType] || 20000;
    const avgExcessDays = portId === 'haldia' ? 3.1 : portId === 'vizag-inner' ? 2.3 : 1.5;

    const p50Cost = Math.round(dailyRate * avgExcessDays * probability);
    const p90Cost = Math.round(dailyRate * avgExcessDays * 2.5 * probability);

    res.json({
      portId,
      vesselType,
      season,
      laytimeDays: Number(laytimeDays),
      portLabel: port.label,
      trtHours: port.trt,
      probability: +probability.toFixed(2),
      probabilityPct: Math.round(probability * 100),
      p50CostUSD: p50Cost,
      p90CostUSD: p90Cost,
      dailyDemurrageRate: dailyRate,
      avgExcessDays,
      interpretation: probability > 0.6
        ? `⚠️ HIGH RISK: ${Math.round(probability * 100)}% chance of exceeding ${laytimeDays}-day laytime. Budget P90 = $${p90Cost.toLocaleString()}.`
        : probability > 0.35
        ? `🟡 MODERATE RISK: ${Math.round(probability * 100)}% chance. Plan for P50 = $${p50Cost.toLocaleString()}.`
        : `🟢 LOW RISK: ${Math.round(probability * 100)}% chance. Normal laytime should be sufficient.`,
      note: portId === 'haldia' ? '⚠️ River port + tidal restriction + above-avg TRT. Consider Sagar-Sandheads lightering.' : ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
