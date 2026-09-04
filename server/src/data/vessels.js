// ============================================================
// VESSEL TYPE SPECIFICATIONS
// Source: Baltic Exchange categories, industry standards
// ============================================================

export const vesselTypes = [
  {
    id: 'handysize',
    name: 'Handysize',
    minDWT: 10000,
    maxDWT: 39999,
    typicalDWT: 32000,
    maxLOA: 200,
    maxDraft: 10.5,
    maxBeam: 32,
    speedKnots: 13,
    dailyFuelConsumption: 25,   // metric tons/day
    fuelType: 'VLSFO',
    fuelPricePerTon: 580,       // USD/ton (approximate)
    isGeared: true,             // Has onboard cranes
    bdiWeight: 0,               // Not included in BDI composite
    advantages: [
      'Access to shallow-draft ports like Haldia',
      'Self-loading/unloading capability (geared)',
      'Highest port accessibility',
      'Lower absolute charter cost',
    ],
    disadvantages: [
      'Highest cost per ton of cargo',
      'Limited cargo volume',
      'Multiple voyages needed for large orders',
    ],
    bestFor: 'Small cargo parcels (<35,000 tons), shallow ports, spot market flexibility',
    avgSpotRate: 12500,         // USD/day (approximate current market)
    avgTimeCharterRate: 11000,  // USD/day
  },
  {
    id: 'supramax',
    name: 'Supramax',
    minDWT: 40000,
    maxDWT: 64999,
    typicalDWT: 58000,
    maxLOA: 200,
    maxDraft: 13.5,
    maxBeam: 32,
    speedKnots: 14,
    dailyFuelConsumption: 32,
    fuelType: 'VLSFO',
    fuelPricePerTon: 580,
    isGeared: true,
    bdiWeight: 0.30,            // 30% of BDI
    advantages: [
      'Good balance of cost and flexibility',
      'Self-loading capability (geared)',
      'Can access most Indian ports',
      'Popular for coal trade routes',
    ],
    disadvantages: [
      'Cannot access the shallowest ports (Haldia inner berths)',
      'Higher cost per ton than Panamax/Capesize',
    ],
    bestFor: 'Medium cargo parcels (40,000-60,000 tons), Indonesia/Mozambique routes',
    avgSpotRate: 14000,
    avgTimeCharterRate: 12500,
  },
  {
    id: 'panamax',
    name: 'Panamax',
    minDWT: 65000,
    maxDWT: 99999,
    typicalDWT: 82000,
    maxLOA: 229,
    maxDraft: 14.5,
    maxBeam: 32.3,
    speedKnots: 14,
    dailyFuelConsumption: 38,
    fuelType: 'VLSFO',
    fuelPricePerTon: 580,
    isGeared: false,
    bdiWeight: 0.30,            // 30% of BDI
    advantages: [
      'Lower cost per ton than Handysize/Supramax',
      'Efficient for medium-long routes',
      'Fits most deep-water Indian ports',
    ],
    disadvantages: [
      'Not geared — requires port cranes for loading/unloading',
      'Cannot access Haldia or Gopalpur',
      'Moderate volatility exposure',
    ],
    bestFor: 'Large cargo parcels (65,000-90,000 tons), Australia/US routes to deep-water ports',
    avgSpotRate: 15500,
    avgTimeCharterRate: 13000,
  },
  {
    id: 'capesize',
    name: 'Capesize',
    minDWT: 100000,
    maxDWT: 200000,
    typicalDWT: 180000,
    maxLOA: 300,
    maxDraft: 18.2,
    maxBeam: 50,
    speedKnots: 14.5,
    dailyFuelConsumption: 55,
    fuelType: 'VLSFO',
    fuelPricePerTon: 580,
    isGeared: false,
    bdiWeight: 0.40,            // 40% of BDI
    advantages: [
      'Lowest cost per ton — massive economies of scale',
      'Most efficient for long-haul Australia routes',
      'Highest volume per voyage',
    ],
    disadvantages: [
      'ONLY fits Paradip, Vizag (outer), Gangavaram, Dhamra',
      'Cannot transit Panama/Suez canal',
      'Highest absolute charter cost',
      'Highest volatility in rates',
    ],
    bestFor: 'Massive cargo parcels (100,000+ tons), Australia→Paradip/Vizag long-haul routes',
    avgSpotRate: 22000,
    avgTimeCharterRate: 18000,
  },
];
