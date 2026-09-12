import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Anchor, LayoutDashboard, Ship, MapPin, AlertTriangle, FileText, TrendingUp, Navigation, Compass, X, Send, Moon, Sun, DollarSign } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ForecastEngine from './pages/ForecastEngine';
import VesselOptimizer from './pages/VesselOptimizer';
import PortIntelligence from './pages/PortIntelligence';
import RiskAlerts from './pages/RiskAlerts';
import ContractPlanner from './pages/ContractPlanner';
import RoutePlanner from './pages/RoutePlanner';
import WhatIfSimulator from './pages/WhatIfSimulator';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import './App.css';

const API = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

const navItems = [
  { path: '/', icon: <LayoutDashboard size={18} />, label: 'Overview Dashboard' },
  { path: '/forecast', icon: <TrendingUp size={18} />, label: 'Freight Forecast' },
  { path: '/vessel', icon: <Ship size={18} />, label: 'Vessel Optimizer' },
  { path: '/ports', icon: <MapPin size={18} />, label: 'Port Intelligence' },
  { path: '/alerts', icon: <AlertTriangle size={18} />, label: 'Risk & Alerts' },
  { path: '/contracts', icon: <FileText size={18} />, label: 'Contract Planner' },
  { path: '/simulator', icon: <Compass size={18} />, label: 'What-If Simulator' },
  { path: '/routes', icon: <Navigation size={18} />, label: 'Route Planner' },
];

function SidebarControls({ theme, toggleTheme }) {
  const { currency, setCurrency, rate } = useCurrency();
  
  return (
    <div className="sidebar-footer">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={toggleTheme} 
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px', background: 'transparent', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button 
          onClick={() => setCurrency(currency === 'USD' ? 'INR' : 'USD')}
          title={`Live Rate: ₹${rate.toFixed(2)}`}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px', background: currency === 'INR' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
            border: `1px solid ${currency === 'INR' ? 'var(--accent-green)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)', color: currency === 'INR' ? 'var(--accent-green)' : 'var(--text-secondary)', 
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
          }}
        >
          {currency === 'USD' ? 'USD' : 'INR'}
        </button>
      </div>
      <div className="user-info">
        <div className="user-avatar">LM</div>
        <div>
          <div className="user-name">Logistics Manager</div>
          <div className="user-role">SAIL — CCSO Dhanbad</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [captainOpen, setCaptainOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'captain', text: 'Namaste! Main Captain hoon — aapka SAIL Freight Advisor. Main real-time FreightCast ML predictions, CAG audit data, aur port conditions ko analyze karke optimal strategy batata hoon. Kuch bhi poocho — vessel selection, COA vs Spot, ya demurrage risk.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Load suggestions
  useEffect(() => {
    fetch(`${API}/captain/suggestions`).then(r => r.json()).then(d => setSuggestions(d.suggestions || [])).catch(() => {});
  }, []);

  const sendChat = async (msg) => {
    const text = msg || chatInput.trim();
    if (!text) return;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch(`${API}/captain/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, currentBDI: 3628, marketStatus: 'UNFAVORABLE' })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'captain', text: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'captain', text: 'Server se connection nahi ho pa raha. Check karo ki backend running hai.' }]);
    }
    setChatLoading(false);
  };

  return (
    <CurrencyProvider>
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

            {/* Live BDI Indicator */}
            <div className="sidebar-live" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div>
                <span className="live-dot"></span>
                LIVE — BDI 3,628
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 400 }}>
                Updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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

            {/* Captain AI Button */}
            <button className="captain-btn" onClick={() => setCaptainOpen(true)}>
              <span className="captain-btn-icon">🧠</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Captain AI</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 400 }}>SAIL Domain Expert</div>
              </div>
            </button>

            <SidebarControls theme={theme} toggleTheme={toggleTheme} />
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
            <Route path="/simulator" element={<WhatIfSimulator />} />
            <Route path="/routes" element={<RoutePlanner />} />
          </Routes>

          <footer className="app-footer">
            <div className="footer-content">
              <div className="footer-brand">
                <Anchor size={16} />
                <span>FreightCast AI</span>
              </div>
              <div className="footer-credit">
                Made with ❤️ by <strong>Team Prakalp</strong> — SIH 2026
              </div>
              <div className="footer-org">Ministry of Steel / SAIL</div>
            </div>
          </footer>
        </main>

        {/* Captain AI Sliding Panel */}
        <div className={`captain-panel ${captainOpen ? 'open' : ''}`}>
          <div className="captain-panel-header">
            <div className="captain-panel-title">
              <div className="captain-avatar">🧠</div>
              <div>
                <div className="captain-name">Captain AI</div>
                <div className="captain-sub">RAG-Powered Domain AI · Integrated with ML Forecasts</div>
              </div>
            </div>
            <button onClick={() => setCaptainOpen(false)} style={{
              background: 'transparent', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)'
            }}>
              <X size={16} />
            </button>
          </div>

          <div className="captain-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="chat-bubble">{msg.text}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-message captain">
                <div className="chat-bubble">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}
          </div>

          <div className="captain-suggestions">
            {suggestions.map(s => (
              <button key={s.id} className="suggestion-chip" onClick={() => sendChat(s.text)}>
                {s.emoji} {s.text.length > 40 ? s.text.slice(0, 40) + '…' : s.text}
              </button>
            ))}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask Captain about freight…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
            />
            <button onClick={() => sendChat()}>
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Overlay */}
        {captainOpen && <div className="captain-overlay" onClick={() => setCaptainOpen(false)} />}
      </div>
    </BrowserRouter>
    </CurrencyProvider>
  );
}

export default App;
