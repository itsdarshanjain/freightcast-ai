import { useState, useEffect } from 'react';
import { Navigation, Clock, Fuel, DollarSign, ArrowRight, Ship } from 'lucide-react';
import TradeMap from '../components/TradeMap';
import API from '../config/api';

export default function RoutePlanner() {
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [originId, setOriginId] = useState('newcastle');
  const [destId, setDestId] = useState('paradip');
  const [routeInfo, setRouteInfo] = useState(null);
  const [portCompat, setPortCompat] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/ports/origins`).then(r => r.json()),
      fetch(`${API}/ports`).then(r => r.json()),
    ]).then(([orig, dest]) => {
      setOrigins(orig.data || []);
      setDestinations(dest.data || []);
    });
  }, []);

  const calculateRoute = () => {
    Promise.all([
      fetch(`${API}/ports/distance/${originId}/${destId}`).then(r => r.json()),
      fetch(`${API}/ports/compatible/${destId}`).then(r => r.json()),
    ]).then(([route, compat]) => {
      setRouteInfo(route.data);
      setPortCompat(compat.data);
    });
  };

  useEffect(() => {
    if (originId && destId) calculateRoute();
  }, [originId, destId]);

  return (
    <>
      <div className="page-header">
        <h2>🧭 Route Planner</h2>
        <p>Interactive voyage planning with distance, sailing time, and port constraint analysis</p>
      </div>

      <div className="page-content">
        {/* Map */}
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🗺️ Global Shipping Network</div>
              <div className="card-subtitle">Showing active route: {originId} → {destId}</div>
            </div>
          </div>
          <TradeMap activeRoute={{ originId, destId }} />
        </div>

        {/* Route Calculator */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">📐 Voyage Calculator</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 16, alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Origin Port (Loading)</label>
              <select className="form-select" value={originId} onChange={e => setOriginId(e.target.value)}>
                {origins.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
                ))}
              </select>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--accent-blue)', marginBottom: 10 }} />
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destination Port (Discharge — East Coast India)</label>
              <select className="form-select" value={destId} onChange={e => setDestId(e.target.value)}>
                {destinations.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.state})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={calculateRoute} style={{ height: 42 }}>
              <Navigation size={16} /> Calculate
            </button>
          </div>
        </div>

        {/* Route Results */}
        {routeInfo && (
          <>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="kpi-card blue">
                <div className="kpi-label"><Navigation size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Distance</div>
                <div className="kpi-value">{routeInfo.distanceNM?.toLocaleString()} <span style={{ fontSize: '0.6rem' }}>NM</span></div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>
                  {routeInfo.distanceKM?.toLocaleString()} km
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-label"><Clock size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Capesize Sailing</div>
                <div className="kpi-value">{routeInfo.sailingTimes?.capesize} <span style={{ fontSize: '0.6rem' }}>days</span></div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>14.5 knots avg speed</div>
              </div>
              <div className="kpi-card amber">
                <div className="kpi-label"><Clock size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Panamax Sailing</div>
                <div className="kpi-value">{routeInfo.sailingTimes?.panamax} <span style={{ fontSize: '0.6rem' }}>days</span></div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>14 knots avg speed</div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-label"><Clock size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Supramax Sailing</div>
                <div className="kpi-value">{routeInfo.sailingTimes?.supramax} <span style={{ fontSize: '0.6rem' }}>days</span></div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>14 knots avg speed</div>
              </div>
            </div>

            {/* Vessel compatibility for selected destination */}
            {portCompat && (
              <div className="charts-grid">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">✅ Compatible at {portCompat.port}</div>
                  </div>
                  {portCompat.compatible?.map(v => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                      <Ship size={18} style={{ color: 'var(--accent-green)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Draft {v.maxDraft}m · LOA {v.maxLOA}m</div>
                      </div>
                      <span className="badge green" style={{ marginLeft: 'auto' }}>OK</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">❌ Restricted at {portCompat.port}</div>
                  </div>
                  {portCompat.incompatible?.map(v => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                      <Ship size={18} style={{ color: 'var(--accent-red)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)' }}>{v.reason}</div>
                      </div>
                      <span className="badge red" style={{ marginLeft: 'auto' }}>NO</span>
                    </div>
                  ))}
                  {portCompat.incompatible?.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      All vessel types can berth at this port ✅
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
