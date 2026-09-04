import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// All port coordinates
const indianPorts = [
  { id: 'paradip', name: 'Paradip', lat: 20.2664, lng: 86.6085, capesize: true },
  { id: 'vizag', name: 'Vizag', lat: 17.6868, lng: 83.2185, capesize: true },
  { id: 'gangavaram', name: 'Gangavaram', lat: 17.6230, lng: 83.2340, capesize: true },
  { id: 'dhamra', name: 'Dhamra', lat: 20.7833, lng: 86.9500, capesize: true },
  { id: 'haldia', name: 'Haldia', lat: 22.0250, lng: 88.0583, capesize: false },
  { id: 'gopalpur', name: 'Gopalpur', lat: 19.2583, lng: 84.9083, capesize: false },
  { id: 'sagar', name: 'Sagar-Sandheads', lat: 21.6500, lng: 88.0500, capesize: false },
];

const originPorts = [
  { id: 'newcastle', name: 'Newcastle, AU', lat: -32.9283, lng: 151.7817, country: 'Australia' },
  { id: 'abbot_point', name: 'Abbot Point, AU', lat: -19.8667, lng: 148.0833, country: 'Australia' },
  { id: 'hampton_roads', name: 'Hampton Roads, US', lat: 36.9465, lng: -76.3133, country: 'United States' },
  { id: 'mobile', name: 'Mobile, US', lat: 30.6954, lng: -88.0399, country: 'United States' },
  { id: 'maputo', name: 'Maputo, MZ', lat: -25.9653, lng: 32.5892, country: 'Mozambique' },
  { id: 'beira', name: 'Beira, MZ', lat: -19.8436, lng: 34.8700, country: 'Mozambique' },
  { id: 'vostochny', name: 'Vostochny, RU', lat: 42.7500, lng: 133.0833, country: 'Russia' },
  { id: 'balikpapan', name: 'Balikpapan, ID', lat: -1.2654, lng: 116.8311, country: 'Indonesia' },
];

// Major trade route lines (origin → Indian port clusters)
const tradeRoutes = [
  { from: 'newcastle', to: 'paradip', color: '#5BC0BE', label: 'AU→India (Coal)' },
  { from: 'abbot_point', to: 'vizag', color: '#3A86FF', label: 'AU→India (Met Coal)' },
  { from: 'hampton_roads', to: 'gangavaram', color: '#E9C46A', label: 'US→India (Met Coal)' },
  { from: 'maputo', to: 'paradip', color: '#2A9D8F', label: 'MZ→India (Coal)' },
  { from: 'balikpapan', to: 'vizag', color: '#E76F51', label: 'ID→India (Coal)' },
  { from: 'vostochny', to: 'dhamra', color: '#8338EC', label: 'RU→India (PCI Coal)' },
];

export default function TradeMap({ activeRoute = null }) {
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    const handleThemeChange = (e) => setTheme(e.detail);
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  useEffect(() => {
    // Destroy previous map if it exists (for theme switching)
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const isLight = theme === 'light';

    // Create map centered on Indian Ocean
    const map = L.map(mapRef.current, {
      center: [10, 75],
      zoom: 3,
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    // Theme-aware tile layer
    const tileUrl = isLight
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(tileUrl, {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri',
    }).addTo(map);

    // Theme-aware label layer for light mode (adds reference labels on top)
    if (isLight) {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
      }).addTo(map);
    }

    // Colors that work on both themes
    const markerBorder = isLight ? '#1C2541' : '#FFFFFF';
    const capesizeColor = isLight ? '#0077B6' : '#5BC0BE';
    const originColor = isLight ? '#E76F51' : '#E9C46A';

    // Add Indian destination ports
    indianPorts.forEach(port => {
      const marker = L.circleMarker([port.lat, port.lng], {
        radius: 8,
        fillColor: port.capesize ? capesizeColor : originColor,
        color: markerBorder,
        weight: 2,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindPopup(`
        <div class="map-popup">
          <strong class="map-popup-title">${port.name}</strong>
          <span class="map-popup-sub">East Coast India</span>
          <span class="map-popup-detail">${port.capesize ? '✅ Capesize OK' : '⚠️ No Capesize'}</span>
        </div>
      `);
    });

    // Add origin ports
    originPorts.forEach(port => {
      const marker = L.circleMarker([port.lat, port.lng], {
        radius: 7,
        fillColor: originColor,
        color: markerBorder,
        weight: 1.5,
        fillOpacity: 0.85,
      }).addTo(map);

      marker.bindPopup(`
        <div class="map-popup">
          <strong class="map-popup-title origin">${port.name}</strong>
          <span class="map-popup-sub">${port.country} — Origin Port</span>
        </div>
      `);
    });

    // Draw animated trade route lines
    tradeRoutes.forEach(route => {
      const from = originPorts.find(p => p.id === route.from);
      const to = indianPorts.find(p => p.id === route.to);
      if (!from || !to) return;

      // If activeRoute is passed, only highlight that specific route (or route that matches origin)
      let isActive = true;
      let lineOpacity = 0.7;
      let lineWeight = 2.5;

      if (activeRoute) {
        if (route.from === activeRoute.originId && route.to === activeRoute.destId) {
          isActive = true;
          lineOpacity = 1;
          lineWeight = 4;
        } else {
          isActive = false;
          lineOpacity = 0.15;
          lineWeight = 1.5;
        }
      }

      // Curved line (using intermediate point)
      const midLat = (from.lat + to.lat) / 2;
      const midLng = (from.lng + to.lng) / 2;
      const offset = Math.abs(from.lng - to.lng) * 0.15;
      const curveMidLat = midLat + offset * 0.3;

      const curvePoints = [
        [from.lat, from.lng],
        [curveMidLat, midLng],
        [to.lat, to.lng],
      ];

      // Draw the actual route line
      L.polyline(curvePoints, {
        color: route.color,
        weight: lineWeight,
        opacity: lineOpacity,
        dashArray: isActive ? '8, 6' : undefined, // Only dash active routes
        className: isActive ? 'animated-route' : '',
        smoothFactor: 2,
      }).addTo(map).bindPopup(`
        <div class="map-popup">
          <strong class="map-popup-title" style="color:${route.color}">${route.label}</strong>
        </div>
      `);
      
      // If there's an activeRoute but it's NOT in our hardcoded tradeRoutes array, draw it dynamically
    });

    if (activeRoute) {
      const dynFrom = originPorts.find(p => p.id === activeRoute.originId);
      const dynTo = indianPorts.find(p => p.id === activeRoute.destId);
      const exists = tradeRoutes.some(r => r.from === activeRoute.originId && r.to === activeRoute.destId);
      
      if (dynFrom && dynTo && !exists) {
        const midLat = (dynFrom.lat + dynTo.lat) / 2;
        const midLng = (dynFrom.lng + dynTo.lng) / 2;
        const offset = Math.abs(dynFrom.lng - dynTo.lng) * 0.15;
        const curvePoints = [[dynFrom.lat, dynFrom.lng], [midLat + offset * 0.3, midLng], [dynTo.lat, dynTo.lng]];
        
        L.polyline(curvePoints, {
          color: '#3A86FF',
          weight: 4,
          opacity: 1,
          dashArray: '8, 6',
          className: 'animated-route',
        }).addTo(map).bindPopup(`
          <div class="map-popup"><strong class="map-popup-title" style="color:#3A86FF">Dynamic Route Analysis</strong></div>
        `);
      }
    }

    // Theme-aware legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div');
      const legendBg = isLight ? '#FFFFFF' : '#1C2541';
      const legendBorder = isLight ? 'rgba(28,37,65,0.15)' : 'rgba(255,255,255,0.1)';
      const legendTitle = isLight ? '#1C2541' : '#FFFFFF';
      const legendText = isLight ? '#3A506B' : '#8D99AE';

      div.style.cssText = `background:${legendBg};padding:14px 18px;border-radius:12px;font-family:Outfit,sans-serif;font-size:11px;color:${legendText};border:1px solid ${legendBorder};box-shadow:0 4px 12px rgba(0,0,0,0.15)`;
      div.innerHTML = `
        <div style="font-weight:700;color:${legendTitle};margin-bottom:8px;font-size:12px;letter-spacing:0.5px;text-transform:uppercase">Trade Routes</div>
        <div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="width:14px;height:4px;background:${capesizeColor};display:inline-block;border-radius:2px"></span> Indian Ports (Capesize)</div>
        <div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="width:14px;height:4px;background:${originColor};display:inline-block;border-radius:2px"></span> Origin / Non-Capesize</div>
        <div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="width:14px;height:2px;background:#3A86FF;display:inline-block;border-radius:2px;border-top:1px dashed #3A86FF"></span> Active Routes</div>
      `;
      return div;
    };
    legend.addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [theme, activeRoute]);

  return (
    <div className="map-container" key={theme}>
      <div ref={mapRef} style={{ height: 450, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} />
    </div>
  );
}
