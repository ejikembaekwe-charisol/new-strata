import React from 'react';

const Stats = () => {
  return (
    <section className="social-proof">
      <div className="stat">
        <div className="stat-val">3.0s</div>
        <div className="stat-label">Avg. Sync Latency</div>
      </div>
      <div className="stat">
        <div className="stat-val">0</div>
        <div className="stat-label">PRs for Token Changes</div>
      </div>
      <div className="stat">
        <div className="stat-val">100%</div>
        <div className="stat-label">Visual Consistency</div>
      </div>
      <div className="stat">
        <div className="stat-val">∞</div>
        <div className="stat-label">Scalable to Any App</div>
      </div>
    </section>
  );
};

export default Stats;
