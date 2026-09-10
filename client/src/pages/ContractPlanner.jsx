import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileText, TrendingDown, Shield, Zap } from 'lucide-react';
import API from '../config/api';

export default function ContractPlanner() {
  const [data, setData] = useState(null);
  const [vesselType, setVesselType] = useState('capesize');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/forecast/contract-comparison?vesselType=${vesselType}`)
      .then(r => r.json())
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vesselType]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const chartData = data?.contracts?.map(c => ({
    name: c.type.split('(')[0].trim(),
    dailyRate: c.dailyRate,
    savings: c.savings || 0,
  })) || [];

  const riskColors = {
    'HIGH': 'var(--accent-red)',
    'MEDIUM': 'var(--accent-amber)',
    'LOW': 'var(--accent-green)',
    'VERY LOW': 'var(--accent-teal)',
  };

  const barColors = ['#ef4444', '#f59e0b', '#10b981', '#14b8a6'];

  return (
    <>
      <div className="page-header">
        <h2><FileText size={28} className="header-icon" /> Contract Planner</h2>
        <p>Compare Spot vs Short-term vs Medium-term vs COA — the PS objective: move from spot to multi-voyage contracts</p>
      </div>

      <div className="page-content">
        {/* Vessel Type Selector */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Vessel Type</label>
            <select className="form-select" value={vesselType} onChange={e => setVesselType(e.target.value)} style={{ width: 200 }}>
              <option value="capesize">Capesize</option>
              <option value="panamax">Panamax</option>
              <option value="supramax">Supramax</option>
              <option value="handysize">Handysize</option>
            </select>
          </div>
        </div>

        {/* Contract Comparison Cards */}
        <div className="contract-cards">
          {data?.contracts?.map((contract, idx) => (
            <div key={idx} className={`contract-card ${idx === data.contracts.length - 1 ? 'best' : ''}`}>
              {idx === data.contracts.length - 1 && (
                <div style={{ marginBottom: 8 }}>
                  <span className="badge green">⭐ PS OBJECTIVE</span>
                </div>
              )}
              <div className="contract-type">{contract.type}</div>
              <div className="contract-rate" style={{ color: barColors[idx] }}>
                ${contract.dailyRate?.toLocaleString()}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/day</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Duration: {contract.duration}
              </div>

              {contract.savings > 0 && (
                <div className="contract-savings">
                  <TrendingDown size={14} style={{ display: 'inline', verticalAlign: -2 }} />
                  {' '}Save ${contract.savings?.toLocaleString()} ({contract.savingsPercent}%)
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 6 }}>
                <span className="badge" style={{
                  background: `${riskColors[contract.riskLevel]}15`,
                  color: riskColors[contract.riskLevel],
                }}>
                  <Shield size={10} /> {contract.riskLevel} risk
                </span>
              </div>

              <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {contract.description}
              </div>

              <div style={{ marginTop: 12, fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monthly Cost</span>
                  <span style={{ fontWeight: 700 }}>${contract.monthlyCost?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>6-Month Projected</span>
                  <span style={{ fontWeight: 700 }}>${contract.projectedCost6Months?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rate Comparison Chart */}
        <div className="chart-card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Daily Rate Comparison by Contract Type</div>
              <div className="card-subtitle">{data?.vesselType} — Lower is better for SAIL</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' }}
                formatter={(value) => [`$${value.toLocaleString()}`, 'Daily Rate']}
              />
              <Bar dataKey="dailyRate" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={barColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendation */}
        <div className="card" style={{ marginTop: 24, borderColor: 'var(--accent-teal)', background: 'linear-gradient(145deg, rgba(20,184,166,0.05), var(--bg-card))' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--accent-teal)' }}>
              <Zap size={16} style={{ display: 'inline', verticalAlign: -3 }} /> AI Recommendation
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {data?.recommendation}
          </p>
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PS Objective Alignment</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
              "Development of model to facilitate moving from multiple single spot contracts being entered into currently to short term / medium term multiple voyage contracts."
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              ✅ This contract planner directly addresses the PS objective by quantifying the cost savings of transitioning from spot to COA contracts for SAIL's 16.3 million tonnes of annual coal imports.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
