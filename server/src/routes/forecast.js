import { Router } from 'express';
import { generateHistoricalBDI, generateForecast, generateSHAPExplanation } from '../data/freightData.js';
import { indianPorts, originPorts, routeDistances } from '../data/ports.js';
import { vesselTypes } from '../data/vessels.js';

const router = Router();

// GET /api/forecast/predict — Get freight rate forecast
router.get('/predict', (req, res) => {
  const { origin, destination, vesselType = 'capesize', daysAhead = 90 } = req.query;

  const historicalData = generateHistoricalBDI(730);
  const forecast = generateForecast(historicalData, parseInt(daysAhead));

  // Find the best entry window (lowest predicted rate in the next 30 days)
  const next30 = forecast.slice(0, Math.min(30, forecast.length));
  const bestEntry = next30.reduce((best, day) =>
    day.predicted < best.predicted ? day : best
  );

  // Get current market status
  const latest = historicalData[historicalData.length - 1];
  const avg30 = historicalData.slice(-30).reduce((s, d) => s + d.bdi, 0) / 30;

  res.json({
    success: true,
    data: {
      forecast,
      bestEntryWindow: {
        date: bestEntry.date,
        predictedBDI: bestEntry.predicted,
        estimatedRate: bestEntry.rates[vesselType] || bestEntry.rates.capesize,
        savingsVsToday: latest.rates[vesselType] - (bestEntry.rates[vesselType] || bestEntry.rates.capesize),
        recommendation: bestEntry.recommendation,
      },
      currentMarket: {
        bdi: latest.bdi,
        avg30Day: Math.round(avg30),
        todayRate: latest.rates[vesselType] || latest.rates.capesize,
      },
    },
  });
});

// GET /api/forecast/explain — SHAP explainability for a prediction
router.get('/explain', (req, res) => {
  const historicalData = generateHistoricalBDI(730);
  const latest = historicalData[historicalData.length - 1];

  const explanation = generateSHAPExplanation(latest.bdi, latest.indicators);

  res.json({
    success: true,
    data: {
      predictedBDI: latest.bdi,
      date: latest.date,
      factors: explanation,
      summary: explanation
        .filter(f => Math.abs(f.impact) > 1)
        .map(f => `${f.feature}: ${f.impact > 0 ? '+' : ''}${f.impact} (${f.direction})`)
        .join('; '),
    },
  });
});

// POST /api/forecast/optimize — Vessel type optimization
router.post('/optimize', (req, res) => {
  const { originId, destinationId, cargoVolumeTons } = req.body;

  if (!originId || !destinationId || !cargoVolumeTons) {
    return res.status(400).json({ success: false, error: 'originId, destinationId, and cargoVolumeTons are required' });
  }

  const origin = originPorts.find(p => p.id === originId);
  const dest = indianPorts.find(p => p.id === destinationId);
  if (!origin || !dest) {
    return res.status(404).json({ success: false, error: 'Invalid origin or destination port' });
  }

  const routeKey = `${originId}-${destinationId}`;
  const distance = routeDistances[routeKey] || 5000;

  const recommendations = [];

  for (const vessel of vesselTypes) {
    // Check port compatibility
    const isCompatible = dest.maxDraft !== null
      && vessel.maxDraft <= dest.maxDraft
      && (dest.maxLOA === null || vessel.maxLOA <= dest.maxLOA);

    // Check origin port compatibility
    const originCompatible = vessel.maxDraft <= origin.maxDraft
      && vessel.maxLOA <= origin.maxLOA;

    if (!isCompatible || !originCompatible) {
      recommendations.push({
        vesselType: vessel.name,
        vesselId: vessel.id,
        compatible: false,
        reason: !isCompatible
          ? `Cannot berth at ${dest.name}: draft ${vessel.maxDraft}m > port max ${dest.maxDraft}m`
          : `Cannot load at ${origin.name}: LOA/draft restrictions`,
      });
      continue;
    }

    // Calculate voyage economics
    const voyagesNeeded = Math.ceil(cargoVolumeTons / vessel.typicalDWT);
    const sailingDays = +(distance / (vessel.speedKnots * 24)).toFixed(1);
    const totalVoyageDays = sailingDays * 2 + (origin.avgLoadingDays || 3) + dest.avgTurnaroundDays;

    // Cost calculation
    const fuelCostPerVoyage = vessel.dailyFuelConsumption * vessel.fuelPricePerTon * totalVoyageDays;
    const charterCostPerVoyage = vessel.avgSpotRate * totalVoyageDays;
    const portCosts = (dest.portCharges.vesselEntry + dest.portCharges.pilotage + dest.portCharges.berth) / 83; // Convert INR to USD approx
    const totalCostPerVoyage = fuelCostPerVoyage + charterCostPerVoyage + portCosts;

    const totalCost = totalCostPerVoyage * voyagesNeeded;
    const costPerTon = +(totalCost / cargoVolumeTons).toFixed(2);

    // TCE calculation
    const freightRevenue = costPerTon * Math.min(cargoVolumeTons, vessel.typicalDWT);
    const voyageCosts = fuelCostPerVoyage + portCosts;
    const tce = +((freightRevenue - voyageCosts) / totalVoyageDays).toFixed(0);

    recommendations.push({
      vesselType: vessel.name,
      vesselId: vessel.id,
      compatible: true,
      voyagesNeeded,
      cargoPerVoyage: Math.min(cargoVolumeTons, vessel.typicalDWT),
      sailingDaysOneWay: sailingDays,
      totalVoyageDays: +totalVoyageDays.toFixed(1),
      totalDaysAllVoyages: +(totalVoyageDays * voyagesNeeded).toFixed(1),
      costBreakdown: {
        charterCost: Math.round(charterCostPerVoyage),
        fuelCost: Math.round(fuelCostPerVoyage),
        portCosts: Math.round(portCosts),
        totalPerVoyage: Math.round(totalCostPerVoyage),
      },
      totalCost: Math.round(totalCost),
      costPerTon,
      tce,
      advantages: vessel.advantages,
      disadvantages: vessel.disadvantages,
    });
  }

  // Sort by cost per ton (cheapest first) among compatible vessels
  const compatible = recommendations.filter(r => r.compatible).sort((a, b) => a.costPerTon - b.costPerTon);
  const incompatible = recommendations.filter(r => !r.compatible);

  // Best recommendation
  const best = compatible[0];

  res.json({
    success: true,
    data: {
      query: {
        origin: origin.name,
        destination: dest.name,
        cargoVolume: cargoVolumeTons,
        routeDistance: `${distance} NM`,
      },
      bestRecommendation: best ? {
        vesselType: best.vesselType,
        costPerTon: best.costPerTon,
        reason: `Lowest cost per ton at $${best.costPerTon}/ton with ${best.voyagesNeeded} voyage(s)`,
      } : null,
      allOptions: [...compatible, ...incompatible],
    },
  });
});

// GET /api/forecast/contract-comparison — Spot vs Short-term vs COA
router.get('/contract-comparison', (req, res) => {
  const { vesselType = 'capesize', volumePerMonth = 100000 } = req.query;
  const vessel = vesselTypes.find(v => v.id === vesselType) || vesselTypes[3]; // default capesize

  const historicalData = generateHistoricalBDI(730);
  const last90 = historicalData.slice(-90);
  const avgRate = Math.round(last90.reduce((s, d) => s + d.rates[vesselType], 0) / 90);
  const currentRate = historicalData[historicalData.length - 1].rates[vesselType];

  // Spot contract: current market rate (volatile)
  const spotCostMonthly = currentRate * 30;
  const spotCost6Months = spotCostMonthly * 6;

  // Short-term (3 month): ~5% discount over spot
  const shortTermRate = Math.round(avgRate * 0.95);
  const shortTermCost = shortTermRate * 30 * 3;
  const shortTermSavings = ((spotCostMonthly * 3) - shortTermCost);

  // Medium-term (6-12 month): ~12% discount
  const medTermRate = Math.round(avgRate * 0.88);
  const medTermCost = medTermRate * 30 * 6;
  const medTermSavings = spotCost6Months - medTermCost;

  // COA (Contract of Affreightment): ~18% discount
  const coaRate = Math.round(avgRate * 0.82);
  const coaCost = coaRate * 30 * 12;
  const coaSavings = ((spotCostMonthly * 12) - coaCost);

  res.json({
    success: true,
    data: {
      vesselType: vessel.name,
      contracts: [
        {
          type: 'Spot Contract',
          duration: 'Per voyage',
          dailyRate: currentRate,
          monthlyCost: spotCostMonthly,
          projectedCost6Months: spotCost6Months,
          savings: 0,
          riskLevel: 'HIGH',
          description: 'Single voyage at current market rate. Maximum flexibility but maximum price exposure.',
        },
        {
          type: 'Short-Term Charter (3 months)',
          duration: '3 months',
          dailyRate: shortTermRate,
          monthlyCost: shortTermRate * 30,
          projectedCost6Months: shortTermCost * 2,
          savings: shortTermSavings,
          savingsPercent: +((shortTermSavings / (spotCostMonthly * 3)) * 100).toFixed(1),
          riskLevel: 'MEDIUM',
          description: 'Lock rate for 3 months. Moderate savings with some market protection.',
        },
        {
          type: 'Medium-Term Charter (6-12 months)',
          duration: '6-12 months',
          dailyRate: medTermRate,
          monthlyCost: medTermRate * 30,
          projectedCost6Months: medTermCost,
          savings: medTermSavings,
          savingsPercent: +((medTermSavings / spotCost6Months) * 100).toFixed(1),
          riskLevel: 'LOW',
          description: 'Significant rate lock-in. Best for predictable cargo volumes.',
        },
        {
          type: 'COA (Contract of Affreightment)',
          duration: '12+ months',
          dailyRate: coaRate,
          monthlyCost: coaRate * 30,
          projectedCost6Months: coaCost / 2,
          savings: coaSavings,
          savingsPercent: +((coaSavings / (spotCostMonthly * 12)) * 100).toFixed(1),
          riskLevel: 'VERY LOW',
          description: 'Multiple voyage commitment. Maximum savings. This is the PS objective — moving SAIL from spot to COA.',
        },
      ],
      recommendation: `Based on current market analysis, a ${vessel.name} Medium-Term Charter saves $${medTermSavings.toLocaleString()} over 6 months compared to spot contracts. For SAIL's 16.3M annual tonnage, COA provides the highest cost efficiency.`,
    },
  });
});

export default router;
