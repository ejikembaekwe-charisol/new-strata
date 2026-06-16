import React from 'react';
import { Link } from 'react-router-dom';

const Docs = () => {
  return (
    <div className="page-container">
      <div className="page-header" style={{ padding: '6rem 0 2rem' }}>
        <span className="section-label" style={{ color: 'var(--text-secondary)' }}>DOCUMENTATION</span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Strata Docs</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>Everything you need to install, configure, and sync your design system in minutes.</p>
        
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.75rem 1.5rem', marginBottom: '2rem' }}>
          <span style={{ marginRight: '10px', color: 'var(--text-secondary)' }}>🔍</span>
          <input type="text" placeholder="Search documentation..." style={{ border: 'none', background: 'transparent', width: '100%', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }} />
        </div>
      </div>

      <div className="page-section" style={{ paddingTop: '0' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quick start</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>01</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Create a project</h3>
            <p style={{ fontSize: '0.8rem' }}>Set up a new Strata project in your dashboard to generate your unique project URL.</p>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>02</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Set your sync URL & tokens</h3>
            <p style={{ fontSize: '0.8rem' }}>Link Strata to your Figma file or tokens repo and publish your initial definitions.</p>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>03</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Install the package</h3>
            <p style={{ fontSize: '0.8rem' }}>Add the @strata-ds/core package to your React or Web Components project.</p>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>04</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Wrap and init</h3>
            <p style={{ fontSize: '0.8rem' }}>Wrap your app in the StrataProvider and use the useComponents hook to access your UI.</p>
          </div>
        </div>
      </div>

      <div className="page-section">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Installation</h2>
        <div className="code-block" style={{ background: 'var(--bg-secondary)' }}>
          <span className="code-gray"># npm</span><br/>
          <span>npm install @strata-ds/core</span><br/><br/>
          <span className="code-gray"># yarn</span><br/>
          <span>yarn add @strata-ds/core</span>
        </div>
      </div>

      <div className="page-section">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>StrataProvider setup</h2>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Wrap your application root with the <code>StrataProvider</code>. This component establishes the connection to the Strata network and manages the caching and polling of your design tokens and components.</p>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', fontWeight: '600' }}>Prop</th>
              <th style={{ padding: '0.75rem', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '0.75rem', fontWeight: '600' }}>Default</th>
              <th style={{ padding: '0.75rem', fontWeight: '600' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><code>projectUrl</code></td>
              <td style={{ padding: '0.75rem', color: 'var(--accent)' }}>string</td>
              <td style={{ padding: '0.75rem' }}>-</td>
              <td style={{ padding: '0.75rem' }}>Required. Your project URL from the Strata dashboard.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><code>mode</code></td>
              <td style={{ padding: '0.75rem', color: 'var(--accent)' }}>'runtime' | 'build'</td>
              <td style={{ padding: '0.75rem' }}>'runtime'</td>
              <td style={{ padding: '0.75rem' }}>Whether to poll for updates live or use the bundled definitions.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><code>pollInterval</code></td>
              <td style={{ padding: '0.75rem', color: 'var(--accent)' }}>number</td>
              <td style={{ padding: '0.75rem' }}>3000</td>
              <td style={{ padding: '0.75rem' }}>Polling interval in milliseconds when in runtime mode.</td>
            </tr>
          </tbody>
        </table>

        <div className="code-block" style={{ background: 'var(--bg-secondary)' }}>
          <span className="code-purple">import</span> <span>{"{"} StrataProvider {"}"}</span> <span className="code-purple">from</span> <span className="code-blue">'@strata-ds/core'</span>;<br/><br/>
          <span className="code-purple">const</span> <span>App = () =&gt; (</span><br/>
          <span style={{ paddingLeft: '1rem' }}>{"<StrataProvider"}</span><br/>
          <span style={{ paddingLeft: '2rem' }}>{"projectUrl=\"https://your-project.strata.io\""}</span><br/>
          <span style={{ paddingLeft: '2rem' }}>{"mode=\"runtime\""}</span><br/>
          <span style={{ paddingLeft: '1rem' }}>{">"}</span><br/>
          <span style={{ paddingLeft: '2rem' }}>{"<YourAppRoot />"}</span><br/>
          <span style={{ paddingLeft: '1rem' }}>{"</StrataProvider>"}</span><br/>
          <span>);</span>
        </div>
      </div>

      <div className="page-section" style={{ paddingBottom: '4rem' }}>
        <div style={{ background: '#111', color: 'white', padding: '3rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Ready to ship your first live update?</h2>
          <Link to="/signup" className="btn btn-secondary" style={{ background: 'white', color: 'black', border: 'none', textDecoration: 'none' }}>Start building</Link>
        </div>
      </div>
    </div>
  );
};

export default Docs;
