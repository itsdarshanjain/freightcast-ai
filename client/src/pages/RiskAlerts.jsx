import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, ShieldAlert, TrendingDown, CloudRain, Anchor } from 'lucide-react';
import API from '../config/api';

export default function RiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/alerts`).then(r => r.json()),
      fetch(`${API}/alerts/summary`).then(r => r.json()),
    ]).then(([alertData, summaryData]) => {
      setAlerts(alertData.data || []);
      setSummary(summaryData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  const iconMap = {
    MARKET_SPIKE: <TrendingDown size={18} />,
    PORT_CONGESTION: <Anchor size={18} />,
    WEATHER: <CloudRain size={18} />,
    FAVORABLE_MARKET: <TrendingDown size={18} style={{ transform: 'scaleY(-1)' }} />,
    DEMURRAGE_RISK: <ShieldAlert size={18} />,
    COAL_PRICE: <Bell size={18} />,
  };

  const timeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      <div className="page-header">
        <h2>⚠️ Risk & Alerts</h2>
        <p>Real-time market volatility warnings, port congestion, weather disruptions, and demurrage risks</p>
      </div>

      <div className="page-content">
        {/* Summary Cards */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <div className="kpi-card red">
            <div className="kpi-label">Total Alerts</div>
            <div className="kpi-value">{summary?.total || 0}</div>
          </div>
          <div className="kpi-card red" style={{ cursor: 'pointer' }} onClick={() => setFilter('high')}>
            <div className="kpi-label">🔴 High Priority</div>
            <div className="kpi-value">{summary?.high || 0}</div>
          </div>
          <div className="kpi-card amber" style={{ cursor: 'pointer' }} onClick={() => setFilter('medium')}>
            <div className="kpi-label">🟡 Medium</div>
            <div className="kpi-value">{summary?.medium || 0}</div>
          </div>
          <div className="kpi-card green" style={{ cursor: 'pointer' }} onClick={() => setFilter('low')}>
            <div className="kpi-label">🟢 Low</div>
            <div className="kpi-value">{summary?.low || 0}</div>
          </div>
          <div className="kpi-card purple">
            <div className="kpi-label">Action Required</div>
            <div className="kpi-value">{summary?.actionRequired || 0}</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              className={filter === f ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'All Alerts' : f}
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filtered.map(alert => (
          <div key={alert.id} className={`alert-card ${alert.severity}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  padding: 8,
                  borderRadius: 'var(--radius-md)',
                  background: alert.severity === 'high' ? 'rgba(239,68,68,0.1)' : alert.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                  color: alert.severity === 'high' ? 'var(--accent-red)' : alert.severity === 'medium' ? 'var(--accent-amber)' : 'var(--accent-green)',
                }}>
                  {iconMap[alert.type] || <AlertTriangle size={18} />}
                </div>
                <div>
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-meta">
                    <span>🕐 {timeAgo(alert.timestamp)}</span>
                    <span>📍 {alert.affectedRoutes?.join(', ')}</span>
                    {alert.actionRequired && <span className="badge red">Action Required</span>}
                  </div>
                </div>
              </div>
              <span className={`badge ${alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'amber' : 'green'}`}>
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
