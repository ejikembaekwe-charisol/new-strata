import React from 'react';
import { Link } from 'react-router-dom';

const Developers = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label" style={{ color: 'var(--text-secondary)' }}>FOR DEVELOPERS</span>
        <h1>Component changes shouldn't need a deploy cycle to reach production</h1>
        <p>Stop blocking design changes on release cycles. Strata syncs tokens and component structure to every connected app in 3 seconds — no redeploy, no ticket, no drift.</p>
        <br />
        <p>Strata delivers design tokens and component definitions at runtime. Wire the provider once — every connected app reflects updates in 3 seconds, no PR required. Bootstrapping a new system is just as fast — upload a screenshot of an existing UI and Strata extracts a starter token and component set automatically.</p>
        
        <div className="cta-group" style={{ marginTop: '2rem' }}>
          <Link to="/docs" className="btn btn-primary" style={{ textDecoration: 'none' }}>Read docs</Link>
          <Link to="/signup" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Start project</Link>
        </div>
      </div>

      <div className="page-section">
        <h2>When this becomes a problem</h2>
        <div className="grid">
          <div className="card">
            <h3>The PM asks why the button is still wrong after three sprints</h3>
            <p style={{ fontSize: '0.9rem' }}>A designer updated the component weeks ago. The package hasn't been bumped. The PR is waiting. The button ships broken again.</p>
          </div>
          <div className="card">
            <h3>Six apps, six slightly different button radii — all from the same system</h3>
            <p style={{ fontSize: '0.9rem' }}>Token drift compounds silently. Every team that forked the package is now on a different version with no clear path back.</p>
          </div>
          <div className="card">
            <h3>Updating one token means touching every app that imports the package</h3>
            <p style={{ fontSize: '0.9rem' }}>What should be a 30-second design change turns into a coordinated release across five repos, three teams, and two sprint cycles.</p>
          </div>
        </div>

        <div className="comparison" style={{ marginTop: '2rem' }}>
          <div className="card" style={{ background: 'transparent' }}>
            <span className="section-label" style={{ color: 'var(--text-secondary)' }}>BEFORE STRATA</span>
            <p style={{ fontSize: '0.9rem' }}>Designer updates a color token in Figma. Engineer bumps the package version, opens a PR, waits for review, merges, redeploys. Three apps are now in sync. Two aren't.</p>
          </div>
          <div className="card" style={{ background: 'transparent' }}>
            <span className="section-label" style={{ color: 'var(--accent)' }}>WITH STRATA</span>
            <p style={{ fontSize: '0.9rem' }}>Designer updates the token in the dashboard. Every connected app reflects it in 3 seconds. No PR. No redeploy. No drift.</p>
          </div>
        </div>
      </div>

      <div className="page-section">
        <h2>Build-time vs runtime</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3>Build-time sync</h3>
            <p style={{ fontSize: '0.9rem' }}>Compile tokens and components at deploy time. Ideal when release governance is strict.</p>
          </div>
          <div className="card">
            <h3>Runtime sync</h3>
            <p style={{ fontSize: '0.9rem' }}>Poll every 3 seconds and apply updates live, including structural component changes.</p>
          </div>
        </div>
      </div>

      <div className="page-section">
        <h2>Structural update moment</h2>
        <div className="code-block">
          <span className="code-gray">{"// existing app usage"}</span><br/>
          <span className="code-blue">{"<CheckoutAction />"}</span><br/><br/>
          
          <span className="code-gray">{"// system definition update"}</span><br/>
          <span>{"CheckoutAction: Button -> Input"}</span><br/><br/>
          
          <span className="code-gray">{"// consuming apps update live in runtime mode"}</span><br/>
          <span className="code-gray">{"// no app redeploy required"}</span>
        </div>
      </div>

      <div className="page-section">
        <h2>Also relevant for your team</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3>For Designers</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Show them how Strata closes the Figma-to-production gap without implementation tickets.</p>
            <a href="/designers" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>See designer outcomes →</a>
          </div>
          <div className="card">
            <h3>For Vibe Coders</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>If you're building with AI tools, Strata gives every generated app a shared design backbone.</p>
            <a href="#vibe-coders" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>See how it works →</a>
          </div>
        </div>
      </div>

      <div className="page-section" style={{ paddingBottom: '8rem' }}>
        <h2>Install options + init</h2>
        <div className="code-block" style={{ background: 'var(--bg-secondary)' }}>
          <span>npm install @strata-ds/core</span><br/><br/>
          <span>import {"{ StrataProvider, useComponents }"} from '@strata-ds/core'</span><br/><br/>
          <span>{"<StrataProvider projectUrl=\"https://your-project.strata.io\">"}</span><br/>
          <span style={{ paddingLeft: '1rem' }}>{"<App />"}</span><br/>
          <span>{"</StrataProvider>"}</span><br/><br/>
          <span>const {"{ Button }"} = useComponents()</span>
        </div>
      </div>
    </div>
  );
};

export default Developers;
