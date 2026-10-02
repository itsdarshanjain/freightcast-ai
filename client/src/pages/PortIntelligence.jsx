import { useState, useEffect } from 'react';
import { MapPin, Ship, AlertTriangle } from 'lucide-react';
import API from '../config/api';

export default function PortIntelligence() {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/ports`)
      .then(r => r.json())
      .then(data => {
        setPorts(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePortSelect = (port) => {
    setSelectedPort(port);
    fetch(`${API}/ports/compatible/${port.id}`)
      .then(r => r.json())
      .then(data => setCompatibility(data.data));
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const congestionColor = { low: 'green', moderate: 'amber', high: 'red' };

  return (
    <>
      <div className="page-header">
        <h2><MapPin size={28} className="header-icon" /> Port Intelligence</h2>
        <p>East Coast India port specifications, vessel compatibility, and congestion monitoring</p>
      </div>

      <div className="page-content">
        {/* Port Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          {ports.map(port => (
            <div
              key={port.id}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: selectedPort?.id === port.id ? 'var(--accent-blue)' : undefined,
                boxShadow: selectedPort?.id === port.id ? 'var(--shadow-glow)' : undefined,
              }}
              onClick={() => handlePortSelect(port)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{port.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{port.state} • Code: {port.code}</div>
                </div>
                <span className={`badge ${congestionColor[port.congestionLevel]}`}>
                  {port.congestionLevel} traffic
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Draft</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{port.maxDraft ? `${port.maxDraft}m` : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max LOA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{port.maxLOA ? `${port.maxLOA}m` : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Handling Rate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{port.cargoHandlingRate?.toLocaleString()} <span style={{ fontSize: '0.6rem' }}>t/day</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Turnaround</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{port.avgTurnaroundDays} <span style={{ fontSize: '0.6rem' }}>days</span></div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                {port.canHandleCapesize ? (
                  <span className="badge green"><Ship size={10} /> Capesize OK</span>
                ) : (
                  <span className="badge red"><AlertTriangle size={10} /> No Capesize</span>
                )}
                <span className="badge blue">{port.berthCount} berths</span>
              </div>

              {port.specialNotes && (
                <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  {port.specialNotes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Vessel Compatibility Panel */}
        {compatibility && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚓ Vessel Compatibility — {compatibility.port}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h4 style={{ fontSize: '0.82rem', color: 'var(--accent-green)', marginBottom: 10 }}>✅ Compatible Vessels</h4>
                {compatibility.compatible?.map(v => (
                  <div key={v.id} style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.05)', borderRadius: 'var(--radius-md)', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                    {v.name} — Draft {v.maxDraft}m, LOA {v.maxLOA}m
                  </div>
                ))}
                {compatibility.compatible?.length === 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No vessels compatible</div>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: '0.82rem', color: 'var(--accent-red)', marginBottom: 10 }}>❌ Incompatible Vessels</h4>
                {compatibility.incompatible?.map(v => (
                  <div key={v.id} style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-md)', marginBottom: 6, fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600 }}>{v.name}</span>
                    <span style={{ color: 'var(--accent-red)', marginLeft: 8, fontSize: '0.75rem' }}>— {v.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Port Comparison Table */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-title">📊 Port Comparison Matrix</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Port</th>
                  <th>State</th>
                  <th>Max Draft</th>
                  <th>Max LOA</th>
                  <th>Berths</th>
                  <th>Handling Rate</th>
                  <th>Turnaround</th>
                  <th>Capesize</th>
                  <th>Congestion</th>
                </tr>
              </thead>
              <tbody>
                {ports.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.state}</td>
                    <td>{p.maxDraft ? `${p.maxDraft}m` : 'N/A'}</td>
                    <td>{p.maxLOA ? `${p.maxLOA}m` : 'N/A'}</td>
                    <td>{p.berthCount}</td>
                    <td>{p.cargoHandlingRate?.toLocaleString()} t/day</td>
                    <td>{p.avgTurnaroundDays} days</td>
                    <td>{p.canHandleCapesize ? <span className="badge green">Yes</span> : <span className="badge red">No</span>}</td>
                    <td><span className={`badge ${congestionColor[p.congestionLevel]}`}>{p.congestionLevel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SAIL Plant-Port Mapping */}
        <div className="card" style={{ marginTop: 24, borderColor: 'var(--accent-purple)', background: 'linear-gradient(145deg, rgba(139,92,246,0.03), var(--bg-card))' }}>
          <div className="card-header">
            <div>
              <div className="card-title">🏭 SAIL Plant → Port Mapping — Optimal Logistics</div>
              <div className="card-subtitle">Each SAIL integrated steel plant mapped to its nearest East Coast port with rail distance</div>
            </div>
            <span className="badge purple">Domain Intel</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { plant: 'Rourkela', state: 'Odisha', port: 'Paradip', distance: '342 km', status: 'Optimal', color: 'green' },
              { plant: 'Bokaro', state: 'Jharkhand', port: 'Paradip', distance: '500 km', status: 'Optimal', color: 'green' },
              { plant: 'Bhilai', state: 'Chhattisgarh', port: 'Vizag/Gangavaram', distance: '800 km', status: 'Long Rail', color: 'amber' },
              { plant: 'Durgapur', state: 'West Bengal', port: 'Haldia', distance: '250 km', status: 'Draft Limited', color: 'red' },
              { plant: 'Burnpur/IISCO', state: 'West Bengal', port: 'Haldia', distance: '200 km', status: 'Draft Limited', color: 'red' },
            ].map((p, i) => (
              <div key={i} style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>🏭</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.plant}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 8 }}>{p.state}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0' }}>↓ {p.distance}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>⚓ {p.port}</div>
                <span className={`badge ${p.color}`} style={{ marginTop: 6, fontSize: '0.6rem' }}>{p.status}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
            💡 Durgapur & Burnpur: Haldia port has only 10.5m draft (Handysize only). Consider Paradip (342-450 km) for Panamax/Capesize shipments to save 40% on per-ton freight despite longer rail distance. CCSO Dhanbad should coordinate dual-port strategy.
          </div>
        </div>
      </div>
    </>
  );
}
