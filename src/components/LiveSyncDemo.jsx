import React, { useState, useEffect } from 'react';

const LiveSyncDemo = () => {
  const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sourceColor, setSourceColor] = useState(colors[0]);
  const [appColor, setAppColor] = useState(colors[0]);
  const [status, setStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    const nextIndex = (currentIndex + 1) % colors.length;
    const nextColor = colors[nextIndex];

    setCurrentIndex(nextIndex);
    setSourceColor(nextColor);
    setStatus('Syncing to connected apps...');
    setIsSyncing(true);

    setTimeout(() => {
      setAppColor(nextColor);
      setStatus('Production Synchronized ✓');
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }, 3000);
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-controls">
          <div className="dot"></div><div className="dot"></div><div className="dot"></div>
        </div>
        <button className="btn btn-primary" onClick={handleSync} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          Change Primary Color
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="sync-window">
          <span className="sync-label">Source (Figma/Strata)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: sourceColor }}></div>
            <code>{sourceColor}</code>
          </div>
        </div>
        <div className="sync-window">
          <span className="sync-label">Connected Apps (Live)</span>
          <div className="sync-target" style={{ background: appColor }}></div>
        </div>
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        right: '2rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-secondary)', 
        opacity: isSyncing ? 1 : 0,
        transition: 'opacity 0.3s'
      }}>
        {status}
      </div>
    </div>
  );
};

export default LiveSyncDemo;
