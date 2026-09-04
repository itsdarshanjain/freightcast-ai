import { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, Zap, Target } from 'lucide-react';
import API from '../config/api';

export default function ForecastEngine() {
  const [forecast, setForecast] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [vesselType, setVesselType] = useState('capesize');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/forecast/predict?vesselType=${vesselType}&daysAhead=90`).then(r => r.json()),
      fetch(`${API}/forecast/explain`).then(r => r.json()),
    ]).then(([fc, exp]) => {
      setForecast(fc.data);
      setExplanation(exp.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [vesselType]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const chartData = forecast?.forecast?.map(d => ({
    date: d.date.substring(5),
    predicted: d.predicted,
    upper: d.upperBound,
    lower: d.lowerBound,
  })) || [];

  return (
    <>
      <div className="page-header">
        <h2>🔮 Freight Forecast Engine</h2>
        <p>AI-powered freight rate prediction with SHAP explainability — CNN-BiLSTM-Attention Model</p>
      </div>

      <div className="page-content">
        {/* Controls */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
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

        {/* Best Entry Window */}
        {forecast?.bestEntryWindow && (
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="kpi-card green">
              <div className="kpi-label">🎯 Best Entry Date</div>
              <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{forecast.bestEntryWindow.date}</div>
              <div className="kpi-change" style={{ color: 'var(--accent-green)' }}>
                <Target size={14} /> Optimal charter window
              </div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-label">Predicted BDI</div>
              <div className="kpi-value">{forecast.bestEntryWindow.predictedBDI}</div>
              <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>
                At best entry point
              </div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-label">Estimated Rate</div>
              <div className="kpi-value">${forecast.bestEntryWindow.estimatedRate?.toLocaleString()}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/day</span></div>
              <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>
                {vesselType} TCE
              </div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Savings vs Today</div>
              <div className="kpi-value">${Math.abs(forecast.bestEntryWindow.savingsVsToday)?.toLocaleString()}</div>
              <div className="kpi-change positive">
                <TrendingUp size={14} /> Per day savings
              </div>
            </div>
          </div>
        )}

        {/* Forecast Chart with Confidence Interval */}
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">BDI Forecast — 90 Day Outlook</div>
              <div className="card-subtitle">Predicted values with confidence interval bands</div>
            </div>
            <span className="badge purple">AI Prediction</span>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="none" fill="#8b5cf6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="lower" name="Lower Bound" stroke="none" fill="#8b5cf6" fillOpacity={0.1} />
              <Line type="monotone" dataKey="predicted" name="Predicted BDI" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
              {forecast?.bestEntryWindow && (
                <ReferenceLine
                  x={forecast.bestEntryWindow.date.substring(5)}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  label={{ value: "Best Entry", position: "top", fill: "#10b981", fontSize: 11 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* SHAP Explainability */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🧠 AI Explainability — SHAP Analysis</div>
              <div className="card-subtitle">What factors are driving the current freight rate prediction</div>
            </div>
            <span className="badge green">Transparent AI</span>
          </div>

          {explanation?.factors?.map((factor, idx) => {
            const maxImpact = Math.max(...explanation.factors.map(f => Math.abs(f.impact)));
            const barWidth = Math.min(100, (Math.abs(factor.impact) / maxImpact) * 100);
            return (
              <div className="shap-bar" key={idx}>
                <div className="shap-feature">{factor.feature}</div>
                <div style={{ width: 100, fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {factor.value}
                </div>
                <div className="shap-impact-bar">
                  <div
                    className={`shap-impact-fill ${factor.direction}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="shap-value" style={{ color: factor.impact > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                  {factor.impact > 0 ? '+' : ''}{factor.impact}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>
              <Zap size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Model Insight:
            </strong>{' '}
            {explanation?.summary || 'No significant factors detected.'}
          </div>
        </div>
      </div>
    </>
  );
}
