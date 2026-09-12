import { useState, useEffect } from 'react';
import { Compass, Zap, AlertTriangle, ChevronRight, Play, Save, Check, TrendingUp, TrendingDown, RefreshCw, BarChart2, Calendar } from 'lucide-react';
import API from '../config/api';
import { useCurrency } from '../context/CurrencyContext';

export default function WhatIfSimulator() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [demurrage, setDemurrage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { formatCurrency, currency } = useCurrency();
  const [demPort, setDemPort] = useState('paradip');
  const [demVessel, setDemVessel] = useState('panamax');
  const [demSeason, setDemSeason] = useState('normal');

  useEffect(() => {
    fetch(`${API}/scenarios/presets`).then(r => r.json()).then(d => setScenarios(d.scenarios || [])).catch(() => {});
    loadDemurrage('paradip', 'panamax', 'normal');
  }, []);

  const simulate = async (scenarioId) => {
    setSimulating(true);
    setActiveScenario(scenarioId);
    try {
      const res = await fetch(`${API}/scenarios/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) { console.error(err); }
    setSimulating(false);
  };

  const loadDemurrage = async (port, vessel, season) => {
    try {
      const res = await fetch(`${API}/scenarios/demurrage?portId=${port}&vesselType=${vessel}&season=${season}`);
      const data = await res.json();
      setDemurrage(data);
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <div className="page-header">
        <h2><Compass size={28} className="header-icon" /> What-If Scenario Simulator</h2>
        <p>Run market disruption scenarios and measure impact on SAIL procurement costs (in Rs. Crore)</p>
      </div>

      <div className="page-content">
        <div className="charts-grid">
          {/* LEFT: Scenario Buttons */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Compass size={16} style={{ display: 'inline', verticalAlign: -3 }} /> Scenarios</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 0 8px' }}>
              {scenarios.map(s => (
                <button
                  key={s.id}
                  className={`scenario-btn ${activeScenario === s.id ? 'active' : ''}`}
                  onClick={() => simulate(s.id)}
                >
                  <span style={{ fontSize: '1.3rem' }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.description?.slice(0, 65)}…</div>
                  </div>
                  {s.isActive && <span className="badge red" style={{ fontSize: '0.6rem' }}>LIVE</span>}
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Impact Analysis */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Zap size={16} style={{ display: 'inline', verticalAlign: -3 }} /> Impact Analysis</div>
            </div>

            {!result && !simulating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, color: 'var(--text-muted)' }}>
                <Compass size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ fontSize: '0.85rem' }}>Select a scenario to see projected impact</p>
              </div>
            )}

            {simulating && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
                <div className="spinner"></div>
              </div>
            )}

            {result && !simulating && (
              <div>
                {/* Scenario Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '2rem' }}>{result.scenario?.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{result.scenario?.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{result.scenario?.description}</div>
                  </div>
                  {result.scenario?.isActive && <span className="badge red">CURRENTLY ACTIVE</span>}
                </div>

                {/* Impact KPIs */}
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
                  {Object.entries(result.scenario?.impact || {}).filter(([k]) =>
                    !['recommendation', 'safeRoutes', 'affectedRoutes', 'panamax_advice', 'capesize_advantage', 'contractMix', 'cagNote'].includes(k)
                  ).slice(0, 6).map(([key, value]) => (
                    <div key={key} className={`kpi-card ${Number(value) > 10 ? 'red' : 'green'}`} style={{ padding: '12px' }}>
                      <div className="kpi-label" style={{ fontSize: '0.65rem' }}>{key.replace(/([A-Z])/g, ' $1').replace(/USD/g, `(${currency})`).trim()}</div>
                      <div className="kpi-value" style={{ fontSize: '1.1rem' }}>
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                {result.scenario?.impact?.recommendation && (
                  <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6, fontSize: '0.85rem' }}>
                      AI Recommendation
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {result.scenario.impact.recommendation}
                    </div>
                    {result.scenario.impact.safeRoutes && (
                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--accent-green)' }}>
                        ✅ Safe Routes: {result.scenario.impact.safeRoutes.join(' | ')}
                      </div>
                    )}
                    {result.scenario.impact.cagNote && (
                      <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        📋 {result.scenario.impact.cagNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Demurrage Risk Calculator */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: -3 }} /> Demurrage Risk Calculator
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" style={{ width: 130, fontSize: '0.78rem' }}
                value={demPort} onChange={e => { setDemPort(e.target.value); loadDemurrage(e.target.value, demVessel, demSeason); }}>
                <option value="paradip">Paradip</option>
                <option value="vizag-inner">Vizag Inner</option>
                <option value="gangavaram">Gangavaram</option>
                <option value="dhamra">Dhamra</option>
                <option value="haldia">Haldia</option>
                <option value="gopalpur">Gopalpur</option>
              </select>
              <select className="form-select" style={{ width: 120, fontSize: '0.78rem' }}
                value={demVessel} onChange={e => { setDemVessel(e.target.value); loadDemurrage(demPort, e.target.value, demSeason); }}>
                <option value="panamax">Panamax</option>
                <option value="capesize">Capesize</option>
                <option value="supramax">Supramax</option>
                <option value="handysize">Handysize</option>
              </select>
              <select className="form-select" style={{ width: 120, fontSize: '0.78rem' }}
                value={demSeason} onChange={e => { setDemSeason(e.target.value); loadDemurrage(demPort, demVessel, e.target.value); }}>
                <option value="normal">Normal</option>
                <option value="q4">Q4 Surge</option>
                <option value="monsoon">Monsoon</option>
                <option value="cyclone">Cyclone</option>
              </select>
            </div>
          </div>

          {demurrage && (
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
              <div className="kpi-card blue">
                <div className="kpi-label">Port Efficiency</div>
                <div className="kpi-value" style={{ fontSize: '1rem' }}>{demurrage.portLabel}</div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>TRT: {demurrage.trtHours}h</div>
              </div>
              <div className={`kpi-card ${demurrage.probabilityPct > 50 ? 'red' : demurrage.probabilityPct > 30 ? 'amber' : 'green'}`}>
                <div className="kpi-label">Demurrage Probability</div>
                <div className="kpi-value">{demurrage.probabilityPct}%</div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>{demurrage.avgExcessDays} excess days avg</div>
              </div>
              <div className={`kpi-card ${demurrage.probabilityPct > 50 ? 'red' : demurrage.probabilityPct > 30 ? 'amber' : 'green'}`}>
                <div className="kpi-label">P50 Expected Demurrage</div>
                <div className="kpi-value">{formatCurrency(demurrage.p50CostUSD)}</div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>Median scenario</div>
              </div>
              <div className={`kpi-card ${demurrage.probabilityPct > 50 ? 'red' : demurrage.probabilityPct > 30 ? 'amber' : 'green'}`}>
                <div className="kpi-label">P90 Risk Exposure</div>
                <div className="kpi-value">{formatCurrency(demurrage.p90CostUSD)}</div>
                <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>{formatCurrency(demurrage.dailyDemurrageRate, true)} rate</div>
              </div>
            </div>
          )}

          {demurrage && (
            <div className={`alert-card ${demurrage.probabilityPct > 50 ? 'high' : demurrage.probabilityPct > 30 ? 'medium' : 'low'}`}
              style={{ margin: '0 0 8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {demurrage.interpretation}
              </div>
              {demurrage.note && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--accent-red)' }}>
                  {demurrage.note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
