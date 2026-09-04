import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Anchor, LayoutDashboard, Ship, MapPin, AlertTriangle, FileText, TrendingUp, Activity, Navigation, Moon, Sun } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ForecastEngine from './pages/ForecastEngine';
import VesselOptimizer from './pages/VesselOptimizer';
import PortIntelligence from './pages/PortIntelligence';
import RiskAlerts from './pages/RiskAlerts';
import ContractPlanner from './pages/ContractPlanner';
import RoutePlanner from './pages/RoutePlanner';
import './App.css';

const navItems = [
  { path: '/', icon: <LayoutDashboard size={18} />, label: 'Overview Dashboard' },
  { path: '/forecast', icon: <TrendingUp size={18} />, label: 'Freight Forecast' },
  { path: '/vessel', icon: <Ship size={18} />, label: 'Vessel Optimizer' },
  { path: '/ports', icon: <MapPin size={18} />, label: 'Port Intelligence' },
  { path: '/alerts', icon: <AlertTriangle size={18} />, label: 'Risk & Alerts' },
  { path: '/contracts', icon: <FileText size={18} />, label: 'Contract Planner' },
  { path: '/routes', icon: <Navigation size={18} />, label: 'Route Planner' },
];

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <Anchor size={22} color="white" />
              </div>
              <div>
                <h1>FreightCast AI</h1>
                <span>SAIL Freight Intelligence</span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button 
              onClick={toggleTheme} 
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginBottom: '16px',
                fontSize: '0.85rem'
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="user-info">
              <div className="user-avatar">LM</div>
              <div>
                <div className="user-name">Logistics Manager</div>
                <div className="user-role">SAIL — CCSO Dhanbad</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/forecast" element={<ForecastEngine />} />
            <Route path="/vessel" element={<VesselOptimizer />} />
            <Route path="/ports" element={<PortIntelligence />} />
            <Route path="/alerts" element={<RiskAlerts />} />
            <Route path="/contracts" element={<ContractPlanner />} />
            <Route path="/routes" element={<RoutePlanner />} />
          </Routes>

          {/* Team Prakalp Footer */}
          <footer className="app-footer">
            <div className="footer-content">
              <div className="footer-brand">
                <Anchor size={16} />
                <span>FreightCast AI</span>
              </div>
              <div className="footer-credit">
                Made with ❤️ by <strong>Team Prakalp</strong> — SIH 2026
              </div>
              <div className="footer-org">
                Ministry of Steel / SAIL
              </div>
            </div>
          </footer>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
