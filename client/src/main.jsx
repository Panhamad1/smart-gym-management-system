import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [health, setHealth] = useState('Checking API...');
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/health`)
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.database || 'API error'); return data; })
      .then(data => setHealth(`API online · MySQL ${data.database}`))
      .catch(() => setHealth('API or MySQL unavailable — check server setup'));
  }, []);
  return <main><header><span className="logo">SG</span><span>Smart Gym Management System</span></header><section className="hero"><p className="eyebrow">PROJECT FOUNDATION · SCRUM-2</p><h1>Welcome to Smart Gym</h1><p>React frontend, Express API and MySQL database foundation.</p><div className="status">{health}</div></section><section className="panel"><h2>Getting started</h2><p>The project skeleton is ready for customer registration, membership management and check-in features.</p></section></main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
