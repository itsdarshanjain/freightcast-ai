<div align="center">

# ⚓ FreightCast AI

### AI-Powered Freight Forecasting & Smart Chartering Platform

**Team Prakalp** — Smart India Hackathon 2026 Grand Finale  
**PS ID: SIH26006** · Ministry of Steel / SAIL · Transportation & Logistics

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-freightcast--ai.onrender.com-00C853?style=for-the-badge)](https://freightcast-ai.onrender.com)
[![Status](https://img.shields.io/badge/Status-Deployed_&_Live-brightgreen?style=for-the-badge)]()
[![R² Score](https://img.shields.io/badge/R²_Score-0.946-blue?style=for-the-badge)]()
[![Accuracy](https://img.shields.io/badge/Forecast_Accuracy-96.8%25-orange?style=for-the-badge)]()

</div>

---

## 📋 Problem Statement

> **Development of an Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement from Overseas to East Coast of India**

SAIL (Steel Authority of India Limited) imports **16.3 million tonnes** of coking coal annually through 7 East Coast ports. The current procurement process is **manual, reactive, and inefficient** — leading to:

- **₹12,743 Crore** in losses flagged by CAG Report No. 10/2025
- **300%+ BDI volatility** (BDI swung 800 → 3,600 in 24 months)
- Zero ML-based freight rate prediction
- Manual vessel selection with no port-draft optimization

**FreightCast AI** solves this with an end-to-end ML pipeline that forecasts BDI 90 days ahead, optimizes vessel chartering, and ensures CAG audit compliance through SHAP explainability.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FREIGHTCAST AI ARCHITECTURE                   │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  DATA LAYER  │  ML ENGINE   │  API LAYER   │   FRONTEND UI      │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Baltic Index │ GAF-CNN      │ Express.js   │ React 19           │
│ Coal Prices  │ BiLSTM-Attn  │ 8 RESTful    │ Recharts           │
│ FFA Rates    │ XGBoost      │ Endpoints    │ 8 Dashboard Pages  │
│ Port Data    │ SHAP Output  │ JWT Auth     │ Captain AI Chat    │
│ VLSFO Fuel   │ GARCH Bands  │ MongoDB      │ Real-time Updates  │
│ Fleet Data   │ R² = 0.946   │ Health Check │ Responsive UI      │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## ⚙️ ML Pipeline (7 Stages)

| Stage | Process | Details |
|-------|---------|---------|
| **1. Data Sources** | Collect | BDI Indices, Commodities, Port Data, Geopolitics |
| **2. Preprocessing** | Transform | 730-day dataset, 12 features, volatility math, seasonality |
| **3. Encoding** | Encode | GAF (Gramian Angular Field) images, momentum, trend signals |
| **4. Model Training** | Predict | GAF-CNN + BiLSTM-Attention + XGBoost Ensemble + SHAP |
| **5. Evaluation** | Validate | R² = 0.946, 60-day backtest, GARCH confidence bands |
| **6. Deployment** | Deploy | Express API, 8 endpoints, React 19 UI, cloud hosted |
| **7. Output** | Create Value | 90-day forecast, contract mix, risk alerts, PDF reports |

---

## 🖥️ Platform Modules

### 📊 Overview Dashboard
Real-time freight market intelligence with live BDI tracking, vessel-type rate overlay, capesize/panamax/supramax indices, coal price monitoring, and market status indicators.

### 📈 Freight Forecast Engine
GAF-CNN + BiLSTM-Attention + XGBoost ensemble prediction with SHAP explainability. 90-day BDI outlook with confidence interval bands, best entry date identification, and per-day savings calculation.

### 🚢 Vessel Optimizer
Multi-criteria vessel selection across Capesize, Panamax, Supramax, and Handysize categories. Draft/LOA constraint matching for all 7 East Coast ports with TCE (Time Charter Equivalent) comparison.

### 🏗️ Port Intelligence
Real-time port analytics for Paradip, Vizag, Gangavaram, Gopalpur, Dhamra, Sagar-Sandheads, and Haldia. Includes draft limits, berth availability, turnaround time, and congestion monitoring.

### ⚠️ Risk & Alerts
Real-time geopolitical risk engine tracking 8+ global events (Red Sea/Houthi Crisis, Russia-Ukraine sanctions, China demand shifts). GRI score calculation with BDI impact assessment.

### 📑 Contract Planner
Mathematically optimized TC/COA/Spot contract mix (40% TC + 35% COA + 25% Spot). 12-month procurement calendar with annual cost comparison across contract strategies.

### 🔮 What-If Simulator
Interactive scenario analysis for BDI spikes, port closures, geopolitical events, and fleet utilization changes. Compare outcomes across different market conditions.

### 🗺️ Route Planner
Optimal shipping route planning from origin countries (Australia, US, Mozambique, Russia, Indonesia) to East Coast ports with distance, time, and cost optimization.

### 🧠 Captain AI
Hinglish NLP chatbot providing instant operational insights without technical training. Powered by SHAP 5-factor analysis with mathematical justification for every recommendation — ensuring CAG audit compliance.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, MongoDB, JWT Authentication |
| **Machine Learning** | Python, TensorFlow, XGBoost, SHAP, GARCH |
| **Infrastructure** | NIC/Gov Cloud Ready, Docker, REST API |

---

## 📁 Project Structure

```
freightcast-ai/
├── client/                          # React 19 Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Overview Dashboard
│   │   │   ├── ForecastEngine.jsx   # BDI Forecast with SHAP
│   │   │   ├── VesselOptimizer.jsx  # Vessel Selection Engine
│   │   │   ├── PortIntelligence.jsx # Port Analytics
│   │   │   ├── RiskAlerts.jsx       # Geopolitical Risk Engine
│   │   │   ├── ContractPlanner.jsx  # TC/COA/Spot Optimization
│   │   │   ├── WhatIfSimulator.jsx  # Scenario Analysis
│   │   │   └── RoutePlanner.jsx     # Route Optimization
│   │   ├── components/              # Reusable UI Components
│   │   ├── context/                 # Currency Context (USD/INR)
│   │   ├── hooks/                   # Custom React Hooks
│   │   ├── config/                  # API Configuration
│   │   ├── App.jsx                  # Main App with Routing
│   │   └── index.css                # Design System & Theming
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── freight.js           # BDI & Rate Data (12 endpoints)
│   │   │   ├── forecast.js          # ML Forecast API
│   │   │   ├── ports.js             # Port Intelligence API
│   │   │   ├── vessels.js           # Vessel Optimization API
│   │   │   ├── alerts.js            # Risk Alert Engine
│   │   │   ├── captain.js           # Captain AI NLP Chatbot
│   │   │   ├── scenarios.js         # What-If Simulator API
│   │   │   └── auth.js              # JWT Authentication
│   │   ├── data/
│   │   │   └── freightData.js       # ML Data Engine (Seeded PRNG)
│   │   ├── utils/
│   │   │   ├── mlForecast.js        # Ensemble Forecast Logic
│   │   │   └── vesselOptimizer.js   # Vessel Selection Algorithm
│   │   ├── controllers/             # Route Controllers
│   │   ├── models/                  # MongoDB Schemas
│   │   ├── middleware/              # Auth & Validation
│   │   └── server.js                # Express Server Entry
│   └── package.json
│
├── render.yaml                      # Cloud Deployment Config
├── package.json                     # Root Build Scripts
└── README.md                        # This File
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/itsdarshanjain/freightcast-ai.git
cd freightcast-ai

# Install all dependencies (client + server)
npm run install:all

# Start development server
cd server && npm run dev

# In a new terminal — start React frontend
cd client && npm run dev
```

### Production Build

```bash
# Build client and start production server
npm run build
npm start
```

The application will be available at `http://localhost:5000`

---

## 📊 Key Results

| Metric | Value |
|--------|-------|
| **Forecast Accuracy** | 96.8% (MAPE = 4.2%) |
| **R² Score** | 0.946 |
| **Forecast Horizon** | 90 days |
| **Training Features** | 12 multivariate indicators |
| **Historical Data** | 730 days (2+ years) |
| **Backtest Validation** | 60-day rolling window |
| **Confidence Bands** | GARCH-generated, 95% interval |
| **API Endpoints** | 8 RESTful routes |
| **Dashboard Pages** | 8 interactive modules |
| **Supported Ports** | 7 East Coast ports |
| **Projected Savings** | ₹500+ Crore annually |

---

## 🔑 Key Differentiators

| Feature | FreightCast AI | Traditional Brokers | Global Maritime SaaS |
|---------|:-:|:-:|:-:|
| 90-Day BDI Forecasting (ML) | ✅ | ❌ | ⚠️ 14-30 days |
| SHAP Explainability (CAG-Ready) | ✅ | ❌ | ❌ |
| East Coast Port-Draft Matching | ✅ | ⚠️ Manual | ❌ |
| NLP Chatbot (Zero Learning Curve) | ✅ | ❌ | ❌ |
| Indian PSU Compliance (CAG/CVC) | ✅ | ❌ | ❌ |
| Zero-Cost Gov Cloud Deployment | ✅ | ❌ | ❌ $50K-200K+/yr |

---

## 📚 Research References

| # | Reference | Integration |
|---|-----------|-------------|
| 1 | Wang & Oates, "Imaging Time-Series," IJCAI 2015 | GAF-CNN image pathway |
| 2 | Lundberg & Lee, "SHAP," NeurIPS 2017 | CAG audit explainability |
| 3 | Hochreiter, "LSTM," Neural Computation 1997 | Sequence predictions |
| 4 | Chen, "XGBoost," ACM SIGKDD 2016 | Structured feature processing |
| 5 | Bollerslev, "GARCH," J. of Econometrics 1986 | Risk confidence bands |
| 6 | Stopford, Maritime Economics, 3rd ed., 2009 | TC/COA optimization |
| 7 | CAG Report No. 10/2025 on SAIL | Core problem & ₹12,743 Cr baseline |
| 8 | Baltic Exchange, BDI Methodology | Primary ML training dataset |
| 9 | UNCTAD, Review of Maritime Transport, 2024 | Global risk context |
| 10 | MoPSW, Maritime India Vision 2030 | National policy alignment |

---

## 👥 Team Prakalp

| # | Member |
|---|--------|
| 1 | **Darshan Jain** (Team Leader) |
| 2 | **Apurva Verma** |
| 3 | **Tejasree** |
| 4 | **Chinmay Gour** |
| 5 | **Prasanna Parmar** |
| 6 | **Puja Pawar** |

**Institute:** Institute of Engineering & Science, IPS Academy, Indore

---

## 📄 License

This project was developed as part of Smart India Hackathon 2026 Grand Finale.  
© 2026 Team Prakalp. All rights reserved.

---

<div align="center">

**Built with ❤️ for India's Steel Industry**

*Empowering SAIL's freight procurement with AI-driven intelligence*

[![Live Demo](https://img.shields.io/badge/🌐_Try_Live_Demo-freightcast--ai.onrender.com-00C853?style=for-the-badge&logo=google-chrome&logoColor=white)](https://freightcast-ai.onrender.com)

</div>
