// ============================================================
// FREIGHTCAST AI — VESSEL OPTIMIZER ENGINE v2.0
// Team Prakalp | SIH 2026
// Full TCE calculation + CII/Carbon + port compatibility
// ============================================================

import { PORTS, ROUTE_DISTANCES, getDistance } from '../data/ports.js';
import { VESSELS } from '../data/vessels.js';

const FUEL_PRICE_VLSFO = 850;     // $/ton Singapore Sept 2026
const BROKERAGE_PCT = 0.0125;     // 1.25% standard broker commission
const USD_TO_INR = 83.5;

export function optimizeVessel(originId, destId, cargoTons, options = {}) {
  const { bdiMultiplier = 1.0, redSeaDisrupted = false } = options;

  const destPort = PORTS.find(p => p.id === destId);
  const originPort = PORTS.find(p => p.id === originId);

  if (!destPort || !originPort) {
    return { error: 'Invalid port IDs', originId, destId };
  }

  const distanceNM = getDistance(originId, destId, redSeaDisrupted);
  if (!distanceNM) {
    return { error: `No route found from ${originId} to ${destId}`, available: Object.keys(ROUTE_DISTANCES) };
  }

  const results = VESSELS.map(vessel => {
    // ── PORT COMPATIBILITY ────────────────────────────────────
    const draftOk = vessel.maxDraft <= destPort.maxDraft;
    const loaOk = vessel.maxLOA <= destPort.maxLOA;
    const beamOk = vessel.maxBeam <= (destPort.maxBeam || 999);

    if (!draftOk || !loaOk) {
      return {
        vessel: vessel.name,
        vesselId: vessel.id,
        emoji: vessel.emoji,
        compatible: false,
        reason: !draftOk
          ? `Draft ${vessel.maxDraft}m exceeds ${destPort.maxDraft}m limit at ${destPort.name}`
          : `LOA ${vessel.maxLOA}m exceeds ${destPort.maxLOA}m limit`,
        ciiRating: vessel.ciiRating,
        color: vessel.color
      };
    }

    // ── VOYAGE ECONOMICS ──────────────────────────────────────
    const sailingDaysLaden = distanceNM / (vessel.speedKnotsLaden * 24);
    const sailingDaysBallast = distanceNM / (vessel.speedKnotsBallast * 24);
    const portDaysOrigin = (originPort.typicalTurnaroundHours || 36) / 24;
    const portDaysDest = destPort.typicalTurnaroundHours / 24;
    const totalDays = sailingDaysLaden + sailingDaysBallast + portDaysOrigin + portDaysDest;

    const voyagesNeeded = Math.ceil(cargoTons / vessel.typicalDWT);
    const adjustedSpotRate = vessel.avgSpotRate * bdiMultiplier;

    // Cost breakdown
    const charterCost = adjustedSpotRate * totalDays;
    const fuelLaden = vessel.fuelConsumptionLaden * sailingDaysLaden * FUEL_PRICE_VLSFO;
    const fuelBallast = vessel.fuelConsumptionBallast * sailingDaysBallast * FUEL_PRICE_VLSFO;
    const fuelPort = vessel.fuelConsumptionPort * (portDaysOrigin + portDaysDest) * FUEL_PRICE_VLSFO;
    const totalFuel = fuelLaden + fuelBallast + fuelPort;
    const portChargesTotal = Object.values(destPort.portCharges || {}).reduce((s, v) => s + v, 0)
                           + Object.values(originPort.portCharges || {}).reduce((s, v) => s + v, 0) * 0.3;
    const brokerage = charterCost * BROKERAGE_PCT;
    const totalVoyageCost = charterCost + totalFuel + portChargesTotal + brokerage;

    // Per-ton
    const effectiveDWT = Math.min(vessel.typicalDWT, cargoTons);
    const costPerTon = totalVoyageCost / effectiveDWT;
    const totalProjectCost = totalVoyageCost * voyagesNeeded;
    const totalProjectCostCrore = +(totalProjectCost * USD_TO_INR / 1e7).toFixed(2);

    // ── CARBON / CII CALCULATION ──────────────────────────────
    // IMO AER formula: g CO2 / (DWT * NM)
    const fuelConsumedLaden = vessel.fuelConsumptionLaden * sailingDaysLaden;
    const co2KgTotal = fuelConsumedLaden * vessel.co2Factor * 1000; // kg
    const co2TonsTotal = co2KgTotal / 1000;
    const co2PerTon = co2TonsTotal / effectiveDWT;                   // t CO2 / t cargo
    const aer = (co2KgTotal) / (vessel.typicalDWT * distanceNM);     // g CO2 / (DWT * NM)
    const ciiRating = getCIIRating(aer);

    // TCE (what owner earns per day — for cross-comparison)
    const tce = Math.round((totalVoyageCost - totalFuel - portChargesTotal - brokerage) / totalDays);

    // Cost breakdown percentages
    const breakdown = {
      charter: Math.round(charterCost / totalVoyageCost * 100),
      fuel: Math.round(totalFuel / totalVoyageCost * 100),
      port: Math.round(portChargesTotal / totalVoyageCost * 100),
      brokerage: Math.round(brokerage / totalVoyageCost * 100)
    };

    return {
      vessel: vessel.name,
      vesselId: vessel.id,
      emoji: vessel.emoji,
      compatible: true,
      typicalDWT: vessel.typicalDWT,
      effectiveDWT,
      voyagesNeeded,
      sailingDaysLaden: +sailingDaysLaden.toFixed(1),
      sailingDaysBallast: +sailingDaysBallast.toFixed(1),
      totalDays: +totalDays.toFixed(1),
      charterRate: Math.round(adjustedSpotRate),
      totalFuel: Math.round(totalFuel),
      portCharges: Math.round(portChargesTotal),
      brokerage: Math.round(brokerage),
      totalVoyageCost: Math.round(totalVoyageCost),
      costPerTon: +costPerTon.toFixed(2),
      totalProjectCost: Math.round(totalProjectCost),
      totalProjectCostCrore,
      co2PerTon: +co2PerTon.toFixed(3),
      co2TonsTotal: +co2TonsTotal.toFixed(1),
      aer: +aer.toFixed(3),
      ciiRating,
      tce,
      breakdown,
      color: vessel.color,
      advantages: vessel.advantages,
      disadvantages: vessel.disadvantages
    };
  });

  // Sort: compatible first, then by costPerTon
  results.sort((a, b) => {
    if (a.compatible && !b.compatible) return -1;
    if (!a.compatible && b.compatible) return 1;
    return (a.costPerTon || 99999) - (b.costPerTon || 99999);
  });

  const compatible = results.filter(r => r.compatible);
  const best = compatible[0];
  const mostGreen = compatible.sort((a, b) => a.aer - b.aer)[0];

  // Re-sort by cost
  compatible.sort((a, b) => a.costPerTon - b.costPerTon);

  const savingsVsWorst = compatible.length > 1
    ? Math.round((compatible[compatible.length - 1].totalProjectCost - compatible[0].totalProjectCost))
    : 0;

  return {
    recommended: compatible[0] || null,
    mostGreen: mostGreen || null,
    all: results,
    compatible,
    incompatible: results.filter(r => !r.compatible),
    savingsVsWorst,
    savingsVsWorstCrore: +(savingsVsWorst * USD_TO_INR / 1e7).toFixed(2),
    distanceNM,
    route: { origin: originPort.name, destination: destPort.name, distanceNM },
    cargoTons,
    voyagesNeeded: compatible[0]?.voyagesNeeded || null
  };
}

function getCIIRating(aer) {
  if (aer < 5.0) return 'A';
  if (aer < 6.0) return 'B';
  if (aer < 7.0) return 'C';
  if (aer < 8.0) return 'D';
  return 'E';
}

// Carbon calculator — standalone
export function calculateCarbon(vesselId, originId, destId, cargoTons, fuelType = 'VLSFO') {
  const CO2_FACTORS = { HFO: 3.114, VLSFO: 3.151, LNG: 2.750 };
  const vessel = VESSELS.find(v => v.id === vesselId);
  const distanceNM = getDistance(originId, destId);
  if (!vessel || !distanceNM) return null;

  const sailingDays = distanceNM / (vessel.speedKnotsLaden * 24);
  const fuelConsumed = vessel.fuelConsumptionLaden * sailingDays;
  const co2Kg = fuelConsumed * CO2_FACTORS[fuelType] * 1000;
  const aer = co2Kg / (vessel.typicalDWT * distanceNM);

  return {
    fuelConsumedTons: +fuelConsumed.toFixed(1),
    co2Tons: +(co2Kg / 1000).toFixed(1),
    co2PerTon: +(co2Kg / 1000 / cargoTons).toFixed(3),
    aer: +aer.toFixed(3),
    ciiRating: getCIIRating(aer),
    fuelType,
    sailingDays: +sailingDays.toFixed(1),
    distanceNM
  };
}

// COA Strategy Advisor
export function adviseCOAStrategy(annualMT, currentBDI = 3628) {
  const marketStatus = currentBDI > 2500 ? 'HIGH' : currentBDI > 1500 ? 'MODERATE' : 'LOW';

  const strategies = {
    HIGH: { tc12m: 0.40, coa6m: 0.35, spot: 0.25 },
    MODERATE: { tc12m: 0.30, coa6m: 0.35, spot: 0.35 },
    LOW: { tc12m: 0.15, coa6m: 0.25, spot: 0.60 }
  };

  const mix = strategies[marketStatus];
  const baseRate = currentBDI / 120;    // $/ton approximate
  const spotCost = annualMT * baseRate * 1.15;        // spot premium
  const tc12mCost = annualMT * baseRate * 0.83;       // 17% TC discount
  const coa6mCost = annualMT * baseRate * 0.89;       // 11% COA discount
  const mixCost = (mix.tc12m * tc12mCost) + (mix.coa6m * coa6mCost) + (mix.spot * spotCost * annualMT / annualMT);

  const optimized = tc12mCost * mix.tc12m + coa6mCost * mix.coa6m + spotCost * mix.spot;
  const savingsUSD = spotCost - optimized;
  const savingsCrore = Math.max(0, Math.round(savingsUSD * USD_TO_INR / 1e7));

  return {
    marketStatus,
    currentBDI,
    annualMT,
    breakdown: {
      tc12m: { pct: Math.round(mix.tc12m * 100), mt: Math.round(annualMT * mix.tc12m) },
      coa6m: { pct: Math.round(mix.coa6m * 100), mt: Math.round(annualMT * mix.coa6m) },
      spot:  { pct: Math.round(mix.spot  * 100), mt: Math.round(annualMT * mix.spot) }
    },
    savingsCrore,
    recommendation: marketStatus === 'HIGH'
      ? `🔴 BDI at ${currentBDI} — 3-year HIGH. Lock 12-month TC IMMEDIATELY. Every week of delay increases Q4 exposure by ~Rs. ${Math.round(savingsCrore / 52)} Crore.`
      : marketStatus === 'MODERATE'
      ? `🟡 Balanced market. Mix spot with 6-month COA hedges.`
      : `🟢 BDI LOW — maximize spot purchases. Avoid locking long-term at bottom prices.`,
    urgency: marketStatus === 'HIGH' ? 'URGENT' : marketStatus === 'MODERATE' ? 'MONITOR' : 'OPPORTUNITY',
    cagNote: 'CAG Report No. 10 of 2025 found Rs. 2,539 Cr lost due to excess spot procurement. This advisor prevents that.'
  };
}
