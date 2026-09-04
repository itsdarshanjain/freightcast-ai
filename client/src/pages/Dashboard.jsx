import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Ship, Anchor, AlertTriangle } from 'lucide-react';
import TradeMap from '../components/TradeMap';
import API from '../config/api';

export default function Dashboard() {
  const [currentData, setCurrentData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/freight/current`).then(r => r.json()),
      fetch(`${API}/freight/historical?days=180`).then(r => r.json()),
      fetch(`${API}/alerts/summary`).then(r => r.json()),
      fetch(`${API}/freight/summary`).then(r => r.json()),
    ]).then(([current, historical, alertSummary, stats]) => {
      setCurrentData(current.data);
      setHistoricalData(historical.data?.map(d => ({
        ...d,
        date: d.date.substring(5), // MM-DD format
      })) || []);
      setAlerts(alertSummary.data);
      setSummary(stats.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const marketStatusColor = {
    'FAVORABLE': 'green',
    'SLIGHTLY FAVORABLE': 'green',
    'NEUTRAL': 'blue',
    'SLIGHTLY UNFAVORABLE': 'amber',
    'UNFAVORABLE': 'red',
  };

  return (
    <>
      <div className="page-header">
        <h2>📊 Overview Dashboard</h2>
        <p>Real-time freight market intelligence for SAIL's East Coast coal procurement</p>
      </div>

      <div className="page-content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card blue">
            <div className="kpi-label">Baltic Dry Index (BDI)</div>
            <div className="kpi-value">{currentData?.bdi?.toLocaleString() || '—'}</div>
            <div className={`kpi-change ${currentData?.bdiChangePercent >= 0 ? 'positive' : 'negative'}`}>
              {currentData?.bdiChangePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {currentData?.bdiChangePercent >= 0 ? '+' : ''}{currentData?.bdiChangePercent}% today
            </div>
          </div>

          <div className={`kpi-card ${marketStatusColor[currentData?.marketStatus] || 'blue'}`}>
            <div className="kpi-label">Market Status</div>
            <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{currentData?.marketStatus || '—'}</div>
            <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>
              30-day avg: {currentData?.avg30DayBDI?.toLocaleString()}
            </div>
          </div>

          <div className="kpi-card green">
            <div className="kpi-label">Capesize Rate</div>
            <div className="kpi-value">${currentData?.rates?.capesize?.toLocaleString() || '—'}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/day</span></div>
            <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>
              TCE — Australia→Paradip route
            </div>
          </div>

          <div className="kpi-card amber">
            <div className="kpi-label">Active Alerts</div>
            <div className="kpi-value">{alerts?.total || 0}</div>
            <div className="kpi-change negative">
              <AlertTriangle size={14} />
              {alerts?.high || 0} high priority
            </div>
          </div>

          <div className="kpi-card purple">
            <div className="kpi-label">Coal Price (Newcastle)</div>
            <div className="kpi-value">${currentData?.indicators?.coalPrice || '—'}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ton</span></div>
            <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>
              Benchmark coking coal
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          {/* BDI Trend Chart */}
          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <div>
                <div className="card-title">BDI & Freight Rate Trends (6 Months)</div>
                <div className="card-subtitle">Baltic Dry Index with vessel-type rate overlay</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge blue">Live Data</span>
                <span className="badge green">{historicalData.length} data points</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={historicalData.slice(-120)}>
                <defs>
                  <linearGradient id="bdiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="bdi" name="BDI" stroke="#3b82f6" fill="url(#bdiGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="capesizeIndex" name="Capesize" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="panamaxIndex" name="Panamax" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="supramaxIndex" name="Supramax" stroke="#10b981" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats + Rate Comparison */}
        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <div className="card-title">📈 Market Statistics</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Avg BDI</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Volatility</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>30 Day</td>
                  <td style={{ fontWeight: 700 }}>{summary?.thirtyDay?.avg?.toLocaleString()}</td>
                  <td>{summary?.thirtyDay?.min?.toLocaleString()}</td>
                  <td>{summary?.thirtyDay?.max?.toLocaleString()}</td>
                  <td><span className="badge amber">{summary?.thirtyDay?.volatility}%</span></td>
                </tr>
                <tr>
                  <td>90 Day</td>
                  <td style={{ fontWeight: 700 }}>{summary?.ninetyDay?.avg?.toLocaleString()}</td>
                  <td>{summary?.ninetyDay?.min?.toLocaleString()}</td>
                  <td>{summary?.ninetyDay?.max?.toLocaleString()}</td>
                  <td><span className="badge amber">{summary?.ninetyDay?.volatility}%</span></td>
                </tr>
                <tr>
                  <td>1 Year</td>
                  <td style={{ fontWeight: 700 }}>{summary?.oneYear?.avg?.toLocaleString()}</td>
                  <td>{summary?.oneYear?.min?.toLocaleString()}</td>
                  <td>{summary?.oneYear?.max?.toLocaleString()}</td>
                  <td><span className="badge amber">{summary?.oneYear?.volatility}%</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">🚢 Current Charter Rates ($/day)</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vessel Type</th>
                  <th>Spot Rate</th>
                  <th>Year Range</th>
                </tr>
              </thead>
              <tbody>
                {['capesize', 'panamax', 'supramax', 'handysize'].map(type => (
                  <tr key={type}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{type}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      ${currentData?.rates?.[type]?.toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Year high/low
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Trade Route Map */}
        <div className="chart-card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🗺️ Global Trade Route Map</div>
              <div className="card-subtitle">Active shipping lanes — Origin ports to East Coast India</div>
            </div>
            <span className="badge blue">Interactive</span>
          </div>
          <TradeMap />
        </div>
      </div>
    </>
  );
}
