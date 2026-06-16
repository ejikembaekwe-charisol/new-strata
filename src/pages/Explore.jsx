import React from 'react';
import { Link } from 'react-router-dom';

const systems = [
  { id: 1, letter: 'M', color: '#1a237e', title: 'My Design', subtitle: 'My app', updated: '17 days ago' },
  { id: 2, letter: 'R', color: '#880e4f', title: 'Rukky', subtitle: 'Random brand for an rhino woman', updated: '22 days ago' },
  { id: 3, letter: 'D', color: '#004d40', title: 'Demo Project', subtitle: 'This is a demo project that enables interacting with Strata', updated: '25 days ago' },
  { id: 4, letter: 'D', color: '#b71c1c', title: 'Demo', subtitle: 'Test', updated: 'about 1 month ago' },
  { id: 5, letter: 'G', color: '#5d4037', title: 'Gregori Showcase', subtitle: 'Showcase for GF', updated: 'about 1 month ago' },
  { id: 6, letter: 'U', color: '#004d40', title: 'UXR Team', subtitle: 'A platform not just for the research team but for anyone who works at the intersection of...', updated: 'about 1 month ago' },
  { id: 7, letter: 'S', color: '#1a237e', title: 'Something Light', subtitle: 'Its for something Light!', updated: 'about 1 month ago' }
];

const Explore = () => {
  return (
    <div className="page-container">
      <div className="page-header" style={{ padding: '6rem 0 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Explore Design Systems</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>Discover public design systems built with Strata — real tokens, real components, live sync.</p>
        
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.75rem 1.5rem', marginBottom: '1.5rem' }}>
          <span style={{ marginRight: '10px', color: 'var(--text-secondary)' }}>🔍</span>
          <input type="text" placeholder="Search by name..." style={{ border: 'none', background: 'transparent', width: '100%', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }} />
        </div>

        <div className="filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Show:</span>
            <button className="btn" style={{ padding: '0.4rem 1rem', borderRadius: '100px', background: 'var(--accent)', color: 'white', border: 'none', fontSize: '0.9rem' }}>Featured</button>
            <button className="btn" style={{ padding: '0.4rem 1rem', borderRadius: '100px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>All</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" style={{ padding: '0.4rem 1rem', borderRadius: '100px', background: 'var(--accent)', color: 'white', border: 'none', fontSize: '0.9rem' }}>Newest</button>
            <button className="btn" style={{ padding: '0.4rem 1rem', borderRadius: '100px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Oldest</button>
          </div>
        </div>
      </div>

      <div className="page-section" style={{ paddingTop: '0' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>7 design systems</p>
        
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {systems.map((sys) => (
            <div key={sys.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: '150%', height: '150%', background: `radial-gradient(circle at center, ${sys.color} 0%, transparent 70%)`, opacity: 0.6, filter: 'blur(20px)', animation: 'pulse 8s infinite alternate ease-in-out', transform: `translate(0, -20%)` }}></div>
                <div style={{ position: 'relative', color: 'white', fontSize: '3.5rem', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 1 }}>
                  {sys.letter}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, var(--bg-secondary) 0%, transparent 100%)', zIndex: 2 }}></div>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, zIndex: 3 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{sys.title}</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '2rem', flex: 1, color: 'var(--text-secondary)' }}>{sys.subtitle}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Updated {sys.updated}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>8 formats: CSS, SCSS...</div>
                  </div>
                  <Link to={`/explore/${sys.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>View →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.9rem', color: 'var(--text-secondary)', paddingBottom: '4rem' }}>
          All 7 design systems shown
        </div>
      </div>
    </div>
  );
};

export default Explore;
