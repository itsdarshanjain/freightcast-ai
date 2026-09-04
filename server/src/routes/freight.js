import { Router } from 'express';
import { generateHistoricalBDI } from '../data/freightData.js';

const router = Router();

// Cache the generated data so it's consistent within a session
let cachedData = null;
function getData() {
  if (!cachedData) cachedData = generateHistoricalBDI(730);
  return cachedData;
}

// GET /api/freight/historical — Get historical BDI + rate data
router.get('/historical', (req, res) => {
  const { days = 365, vesselType } = req.query;
  let data = getData();

  // Limit to requested days
  data = data.slice(-Math.min(parseInt(days), 730));

  res.json({ success: true, count: data.length, data });
});

// GET /api/freight/current — Get latest market snapshot
router.get('/current', (req, res) => {
  const data = getData();
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];

  const bdiChange = latest.bdi - previous.bdi;
  const bdiChangePercent = +((bdiChange / previous.bdi) * 100).toFixed(2);

  // Determine market status
  let marketStatus = 'NEUTRAL';
  const avg30 = data.slice(-30).reduce((s, d) => s + d.bdi, 0) / 30;
  if (latest.bdi < avg30 * 0.92) marketStatus = 'FAVORABLE';
  else if (latest.bdi < avg30 * 0.97) marketStatus = 'SLIGHTLY FAVORABLE';
  else if (latest.bdi > avg30 * 1.08) marketStatus = 'UNFAVORABLE';
  else if (latest.bdi > avg30 * 1.03) marketStatus = 'SLIGHTLY UNFAVORABLE';

  res.json({
    success: true,
    data: {
      ...latest,
      bdiChange,
      bdiChangePercent,
      marketStatus,
      avg30DayBDI: Math.round(avg30),
      avg90DayBDI: Math.round(data.slice(-90).reduce((s, d) => s + d.bdi, 0) / 90),
      yearHigh: Math.max(...data.slice(-252).map(d => d.bdi)),
      yearLow: Math.min(...data.slice(-252).map(d => d.bdi)),
    },
  });
});

// GET /api/freight/summary — Summary statistics
router.get('/summary', (req, res) => {
  const data = getData();
  const last30 = data.slice(-30);
  const last90 = data.slice(-90);
  const last365 = data.slice(-252);

  const calcStats = (arr) => ({
    avg: Math.round(arr.reduce((s, d) => s + d.bdi, 0) / arr.length),
    min: Math.min(...arr.map(d => d.bdi)),
    max: Math.max(...arr.map(d => d.bdi)),
    volatility: +(Math.sqrt(
      arr.reduce((s, d, i) => {
        if (i === 0) return 0;
        const ret = (d.bdi - arr[i - 1].bdi) / arr[i - 1].bdi;
        return s + ret * ret;
      }, 0) / (arr.length - 1)
    ) * 100 * Math.sqrt(252)).toFixed(2), // Annualized volatility %
  });

  res.json({
    success: true,
    data: {
      thirtyDay: calcStats(last30),
      ninetyDay: calcStats(last90),
      oneYear: calcStats(last365),
      totalDataPoints: data.length,
    },
  });
});

export default router;
