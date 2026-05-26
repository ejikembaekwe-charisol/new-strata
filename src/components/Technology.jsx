import React from 'react';
import LiveSyncDemo from './LiveSyncDemo';

const Technology = () => {
  return (
    <section id="how-it-works" class="section reveal">
      <div className="section-header">
        <span className="section-label">Technology</span>
        <h2>Set up once. ship forever.</h2>
      </div>
      <div className="grid">
        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔌</div>
          <h3>Connect Sources</h3>
          <p>Point Strata at Figma or your Style Dictionary. We parse and normalize your tokens and components instantly.</p>
        </div>
        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
          <h3>One-Time Install</h3>
          <p>Developers install our SDK once. It establishes a secure, high-speed connection to the Strata Design API.</p>
        </div>
        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
          <h3>Instant Delivery</h3>
          <p>Changes propagate through our global CDN. Your app updates its visual state at runtime with zero flicker.</p>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}>
        <LiveSyncDemo />
      </div>

      <div style={{ marginTop: '4rem' }}>
        <div className="code-block">
          <div className="code-gray">// 1. Install the SDK</div>
          <div><span className="code-blue">npm</span> install @strata-ds/core</div>
          <br />
          <div className="code-gray">// 2. Wrap your application</div>
          <div>&lt;<span className="code-purple">StrataProvider</span> <span className="code-blue">id</span>="project_82h1"&gt;</div>
          <div>&nbsp;&nbsp;&lt;<span className="code-purple">App</span> /&gt;</div>
          <div>&lt;/<span class="code-purple">StrataProvider</span>&gt;</div>
          <br />
          <div className="code-gray">// 3. Use tokens that update automatically</div>
          <div><span className="code-blue">const</span> Button = () =&gt; (</div>
          <div>&nbsp;&nbsp;&lt;<span className="code-purple">button</span> <span className="code-blue">style</span>={"{{ background: useToken('brand.primary') }}"} /&gt;</div>
          <div>)</div>
        </div>
      </div>
    </section>
  );
};

export default Technology;
