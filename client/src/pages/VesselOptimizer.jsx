import { useState, useEffect } from 'react';
import { Ship, Check, X, DollarSign } from 'lucide-react';
import API from '../config/api';

export default function VesselOptimizer() {
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [originId, setOriginId] = useState('newcastle');
  const [destId, setDestId] = useState('paradip');
  const [cargoVolume, setCargoVolume] = useState(100000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/ports/origins`).then(r => r.json()),
      fetch(`${API}/ports`).then(r => r.json()),
    ]).then(([orig, dest]) => {
      setOrigins(orig.data || []);
      setDestinations(dest.data || []);
    });
  }, []);

  // Auto-optimize when inputs change or on first load
  useEffect(() => {
    if (!originId || !destId || !cargoVolume) return;
    handleOptimize();
  }, [originId, destId, cargoVolume]);

  const handleOptimize = () => {
    setLoading(true);
    fetch(`${API}/forecast/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originId, destinationId: destId, cargoVolumeTons: parseInt(cargoVolume) }),
    })
      .then(r => r.json())
      .then(data => {
        setResult(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <>
      <div className="page-header">
        <h2><Ship size={28} className="header-icon" /> Vessel Optimizer</h2>
        <p>Find the optimal vessel type considering cargo volume, port constraints, and voyage economics</p>
      </div>

      <div className="page-content">
        {/* Input Form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Configure Shipment</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Origin Port</label>
              <select className="form-select" value={originId} onChange={e => setOriginId(e.target.value)}>
                {origins.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destination Port (East Coast India)</label>
              <select className="form-select" value={destId} onChange={e => setDestId(e.target.value)}>
                {destinations.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cargo Volume (Tons)</label>
              <input type="number" className="form-input" value={cargoVolume} onChange={e => setCargoVolume(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleOptimize} disabled={loading} style={{ height: 42 }}>
              <Ship size={16} /> {loading ? 'Analyzing...' : 'Optimize'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Route Info */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="kpi-card blue">
                <div className="kpi-label">Route</div>
                <div className="kpi-value" style={{ fontSize: '1rem' }}>{result.query.origin} → {result.query.destination}</div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-label">Cargo Volume</div>
                <div className="kpi-value">{parseInt(result.query.cargoVolume).toLocaleString()} <span style={{ fontSize: '0.7rem' }}>tons</span></div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-label">Route Distance</div>
                <div className="kpi-value">{result.query.routeDistance}</div>
              </div>
            </div>

            {/* Best Recommendation */}
            {result.bestRecommendation && (
              <div className="card" style={{ marginBottom: 24, borderColor: 'var(--accent-green)', background: 'linear-gradient(145deg, rgba(16,185,129,0.05), var(--bg-card))' }}>
                <div className="card-header">
                  <div className="card-title" style={{ color: 'var(--accent-green)' }}>⭐ Recommended: {result.bestRecommendation.vesselType}</div>
                  <span className="badge green">Best Option</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{result.bestRecommendation.reason}</p>
              </div>
            )}

            {/* All Vessel Options */}
            <div className="vessel-grid">
              {result.allOptions?.map((option, idx) => (
                <div key={idx} className={`vessel-card ${option.compatible ? (idx === 0 ? 'recommended' : '') : 'incompatible'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="vessel-name">{option.vesselType}</div>
                      <div className="vessel-dwt">
                        {option.compatible ? (
                          <span className="badge green"><Check size={10} /> Compatible</span>
                        ) : (
                          <span className="badge red"><X size={10} /> Incompatible</span>
                        )}
                      </div>
                    </div>
                    <Ship size={28} style={{ color: option.compatible ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                  </div>

                  {option.compatible ? (
                    <>
                      <div className="vessel-cost">
                        <DollarSign size={20} style={{ display: 'inline', verticalAlign: -3 }} />
                        {option.costPerTon}/ton
                      </div>

                      <table style={{ width: '100%', fontSize: '0.78rem' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Voyages Needed</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{option.voyagesNeeded}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Sailing (one way)</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{option.sailingDaysOneWay} days</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Total Days</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{option.totalDaysAllVoyages} days</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Charter/Voyage</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>${option.costBreakdown?.charterCost?.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Fuel/Voyage</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>${option.costBreakdown?.fuelCost?.toLocaleString()}</td>
                          </tr>
                          <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ color: 'var(--accent-cyan)', padding: '6px 0', fontWeight: 600 }}>Total Cost</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-cyan)' }}>${option.totalCost?.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-red)', marginTop: 12 }}>{option.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
