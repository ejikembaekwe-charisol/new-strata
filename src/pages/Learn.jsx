import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LEARN_CHAPTERS, LEARN_TOC } from '../data/learnContent';

// The Learn guide. Twelve chapters on what a design system is and where Strata sits, read
// top to bottom or jumped into from the contents.
//
// The prose lives in learnContent.js — this file only decides how each kind of block is
// drawn. Docs covers installing and wiring the package; this covers the thinking behind
// the system you would install.

/* ── the block renderers ── */

const Paragraph = ({ children }) => (
  <p style={{
    fontSize: '1rem', lineHeight: 1.75, color: 'var(--text-secondary)',
    margin: '0 0 1.1rem', maxWidth: '68ch',
  }}>
    {children}
  </p>
);

const SubHeading = ({ children, small }) => (
  <h3 style={{
    fontFamily: 'var(--font-heading)',
    fontSize: small ? '1rem' : '1.35rem',
    fontWeight: small ? 600 : 500,
    color: 'var(--text-primary)',
    letterSpacing: small ? '0' : '-0.02em',
    margin: small ? '1.75rem 0 0.6rem' : '2.75rem 0 0.9rem',
  }}>
    {children}
  </h3>
);

const BulletList = ({ items }) => (
  <ul style={{ listStyle: 'none', margin: '0 0 1.4rem', padding: 0, display: 'grid', gap: '0.5rem' }}>
    {items.map(item => (
      <li key={item} style={{
        display: 'flex', gap: '0.7rem', alignItems: 'baseline',
        fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        <span aria-hidden="true" style={{
          width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)', opacity: 0.7, transform: 'translateY(-3px)',
        }} />
        {item}
      </li>
    ))}
  </ul>
);

// A token name, written the way it would be written in the system.
const TokenChips = ({ names }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0 0 1.4rem' }}>
    {names.map(name => (
      <code key={name} style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
        color: 'var(--accent)', background: 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderRadius: '7px',
        padding: '0.35rem 0.7rem',
      }}>
        {name}
      </code>
    ))}
  </div>
);

// Each step feeds the one below it, so the connector is drawn down the left rather than
// leaving the reader to infer the direction from the order alone.
const Flow = ({ steps }) => (
  <div style={{ margin: '0 0 1.6rem', display: 'grid', gap: '0.85rem' }}>
    {steps.map((step, i) => (
      <div key={step.label} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
        <span aria-hidden="true" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          flexShrink: 0, paddingTop: '0.45rem',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--accent)',
          }} />
          {i < steps.length - 1 && (
            <span style={{
              width: '1px', flex: 1, minHeight: '1.4rem',
              background: 'var(--border-bright)', marginTop: '0.3rem',
            }} />
          )}
        </span>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>
          <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{step.label}</strong>{' '}
          {step.text}
        </p>
      </div>
    ))}
  </div>
);

const Pipeline = ({ stages }) => (
  <div style={{
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem',
    margin: '0 0 1.6rem',
  }}>
    {stages.map((stage, i) => (
      <React.Fragment key={stage + i}>
        {i > 0 && <span aria-hidden="true" style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>&rarr;</span>}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--text-primary)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '100px',
          padding: '0.3rem 0.75rem', whiteSpace: 'nowrap',
        }}>
          {stage}
        </span>
      </React.Fragment>
    ))}
  </div>
);

const Cards = ({ cards }) => (
  <div className="learn-cards" style={{ margin: '0 0 1.6rem' }}>
    {cards.map(card => (
      <div key={card.title} style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1.1rem 1.2rem',
      }}>
        <h4 style={{
          fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 600,
          color: 'var(--text-primary)', margin: '0 0 0.4rem',
        }}>
          {card.title}
        </h4>
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
          {card.text}
        </p>
      </div>
    ))}
  </div>
);

const Stages = ({ stages }) => (
  <div style={{ margin: '0 0 1.6rem', display: 'grid', gap: '1.75rem' }}>
    {stages.map(stage => (
      <div key={stage.num} style={{ display: 'flex', gap: '1.1rem', alignItems: 'flex-start' }}>
        <span style={{
          flexShrink: 0, width: '30px', height: '30px', borderRadius: '9px',
          background: 'var(--accent-glow)', border: '1px solid var(--accent)',
          color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {stage.num}
        </span>
        <div style={{ minWidth: 0 }}>
          {/* Not SubHeading: its top margin is what separates a heading from the paragraph
              above it, and here there is nothing above — it would only push the title out
              of line with its number. */}
          <h3 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600,
            color: 'var(--text-primary)', letterSpacing: 0, margin: '0.3rem 0 0.6rem',
          }}>
            {stage.title}
          </h3>
          {stage.lines.map(line => (
            <p key={line} style={{
              fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)',
              margin: '0 0 0.7rem', maxWidth: '64ch',
            }}>
              {line}
            </p>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const PullQuote = ({ children }) => (
  <p style={{
    fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 400,
    lineHeight: 1.5, letterSpacing: '-0.01em', color: 'var(--text-primary)',
    borderLeft: '2px solid var(--accent)', paddingLeft: '1.2rem',
    margin: '1.6rem 0 1.6rem', maxWidth: '58ch',
  }}>
    {children}
  </p>
);

const QandA = ({ items }) => (
  <div style={{ display: 'grid', gap: '0.75rem' }}>
    {items.map(item => (
      <div key={item.q} style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1.2rem 1.35rem',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600,
          color: 'var(--text-primary)', margin: '0 0 0.5rem', letterSpacing: 0,
        }}>
          {item.q}
        </h3>
        <p style={{
          fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)',
          margin: '0 0 0.5rem',
        }}>
          {item.short}
        </p>
        {item.a.map(line => (
          <p key={line} style={{
            fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)',
            margin: '0 0 0.55rem',
          }}>
            {line}
          </p>
        ))}
      </div>
    ))}
  </div>
);

const LinkCards = ({ links }) => (
  <div style={{ display: 'grid', gap: '0.75rem', margin: '0 0 1.6rem' }}>
    {links.map(link => (
      <Link
        key={link.to}
        to={link.to}
        className="learn-link-card"
        style={{
          display: 'block', textDecoration: 'none',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '1.1rem 1.25rem',
          transition: 'border-color 0.2s, transform 0.2s',
        }}
      >
        <span style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600,
          color: 'var(--text-primary)', marginBottom: '0.35rem',
        }}>
          {link.title}
          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>&rarr;</span>
        </span>
        <span style={{ display: 'block', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {link.text}
        </span>
      </Link>
    ))}
  </div>
);

// One block. Anything unrecognised is skipped rather than rendered as an empty element —
// a new block kind added to the content file should be silent until it has a renderer,
// not a blank gap the reader has to interpret.
const renderBlock = (block, i) => {
  const key = block.t + i;
  switch (block.t) {
    case 'p': return <Paragraph key={key}>{block.v}</Paragraph>;
    case 'h3': return <SubHeading key={key}>{block.v}</SubHeading>;
    case 'h4': return <SubHeading key={key} small>{block.v}</SubHeading>;
    case 'ul': return <BulletList key={key} items={block.v} />;
    case 'token': return <TokenChips key={key} names={Array.isArray(block.v) ? block.v : [block.v]} />;
    case 'flow': return <Flow key={key} steps={block.v} />;
    case 'pipeline': return <Pipeline key={key} stages={block.v} />;
    case 'cards': return <Cards key={key} cards={block.v} />;
    case 'stages': return <Stages key={key} stages={block.v} />;
    case 'quote': return <PullQuote key={key}>{block.v}</PullQuote>;
    case 'qa': return <QandA key={key} items={block.v} />;
    case 'links': return <LinkCards key={key} links={block.v} />;
    default: return null;
  }
};

/* ── the page ── */

const Learn = () => {
  const [activeId, setActiveId] = useState(LEARN_TOC[0].id);
  const tocRef = useRef(null);

  // Which chapter the reader is in. Chapters are far taller than the viewport, so the
  // rule is "the last heading to have crossed the top of the screen" rather than
  // "whichever section is most visible" — the latter flickers between two long chapters.
  useEffect(() => {
    const onScroll = () => {
      // Below the fixed nav, and a little further so a heading counts as reached only
      // once it is comfortably on screen.
      const line = 140;
      let current = LEARN_TOC[0].id;
      for (const { id } of LEARN_TOC) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On a phone the contents is a horizontal strip, so the active chapter has to be
  // scrolled into view or it drifts off the end as the reader moves down the page.
  useEffect(() => {
    const strip = tocRef.current;
    if (!strip || strip.scrollWidth <= strip.clientWidth) return;
    const link = strip.querySelector('[data-active="true"]');
    if (link) link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  return (
    <div className="page-container learn-page">
      <style dangerouslySetInnerHTML={{ __html: LEARN_CSS }} />

      <header className="learn-hero">
        <span className="section-label" style={{ color: 'var(--text-secondary)' }}>LEARN</span>
        <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', lineHeight: 1.1, margin: '0.75rem 0 1.1rem' }}>
          Design systems, and where Strata fits
        </h1>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.65, color: 'var(--text-secondary)', maxWidth: '46rem', margin: 0 }}>
          A guide to what a design system is, the problem it solves, and how Strata helps you
          create, organize, refine, and connect one. Twelve chapters, in order, or start
          wherever you need.
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: '1.5rem',
        }}>
          {LEARN_CHAPTERS.length} chapters
          <span aria-hidden="true" style={{ margin: '0 0.6rem', opacity: 0.5 }}>&middot;</span>
          Conceptual guide
          <span aria-hidden="true" style={{ margin: '0 0.6rem', opacity: 0.5 }}>&middot;</span>
          <Link to="/docs" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Developer docs &rarr;</Link>
        </p>
      </header>

      <div className="learn-shell">
        {/* Sticky on a desktop, a horizontal strip on a phone — same markup either way. */}
        <nav className="learn-toc" aria-label="Chapters">
          <span className="learn-toc-label">Contents</span>
          <div className="learn-toc-list" ref={tocRef}>
            {LEARN_TOC.map(({ id, num, title }) => (
              <a
                key={id}
                href={'#' + id}
                data-active={activeId === id}
                className="learn-toc-link"
                aria-current={activeId === id ? 'true' : undefined}
              >
                <span className="learn-toc-num">{num}</span>
                <span className="learn-toc-title">{title}</span>
              </a>
            ))}
          </div>
        </nav>

        <main className="learn-body">
          {LEARN_CHAPTERS.map((chapter, i) => (
            <section key={chapter.id} id={chapter.id} className="learn-chapter">
              <div className="learn-chapter-head">
                <span className="learn-chapter-num">{chapter.num}</span>
                <h2 className="learn-chapter-title">{chapter.title}</h2>
              </div>
              <p className="learn-chapter-lede">{chapter.lede}</p>
              {chapter.blocks.map(renderBlock)}

              {/* Reading in order is the default, so the next chapter is one click away. */}
              {i < LEARN_CHAPTERS.length - 1 && (
                <a href={'#' + LEARN_CHAPTERS[i + 1].id} className="learn-next">
                  <span className="learn-next-label">Next</span>
                  <span className="learn-next-title">
                    {LEARN_CHAPTERS[i + 1].num} &middot; {LEARN_CHAPTERS[i + 1].title}
                  </span>
                  <span aria-hidden="true">&darr;</span>
                </a>
              )}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

const LEARN_CSS = `
.learn-page { padding-bottom: 5rem; }

.learn-hero {
  padding: 2rem 2rem 3rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
}

.learn-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: 4rem;
  padding: 0 2rem;
  align-items: start;
}

.learn-toc { position: sticky; top: 100px; }

.learn-toc-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-tertiary);
  padding: 0 0 0.75rem 0.7rem;
}

.learn-toc-list { display: flex; flex-direction: column; gap: 0.1rem; }

.learn-toc-link {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  padding: 0.4rem 0.7rem;
  border-radius: 7px;
  border-left: 2px solid transparent;
  font-size: 0.84rem;
  line-height: 1.4;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.learn-toc-link:hover { color: var(--text-primary); background: var(--bg-secondary); }
.learn-toc-link[data-active="true"] {
  color: var(--text-primary);
  border-left-color: var(--accent);
  background: var(--bg-secondary);
}
.learn-toc-num {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.learn-toc-link[data-active="true"] .learn-toc-num { color: var(--accent); }

.learn-chapter {
  /* Clears the fixed nav when a chapter is jumped to from the contents. */
  scroll-margin-top: 96px;
  padding-bottom: 4rem;
  margin-bottom: 4rem;
  border-bottom: 1px solid var(--border);
}
.learn-chapter:last-child { border-bottom: none; margin-bottom: 0; }

.learn-chapter-head {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  margin-bottom: 0.9rem;
}
.learn-chapter-num {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--accent);
  letter-spacing: 0.04em;
}
.learn-chapter-title {
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 3.5vw, 2.1rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
}
.learn-chapter-lede {
  font-size: 1.1rem;
  line-height: 1.65;
  color: var(--text-primary);
  max-width: 62ch;
  margin: 0 0 1.75rem;
}

.learn-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
  gap: 0.75rem;
}

.learn-link-card:hover { border-color: var(--accent) !important; transform: translateY(-2px); }

.learn-next {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 2.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--border);
  border-radius: 100px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
}
.learn-next:hover { border-color: var(--accent); color: var(--text-primary); }
.learn-next-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

@media (max-width: 900px) {
  .learn-hero { padding: 1rem 1.25rem 2rem; margin-bottom: 1rem; }
  /* minmax(0, 1fr) rather than 1fr: a grid item's default min-width is auto, so the
     row of chapter chips below would widen the column to its own content width
     instead of scrolling inside it. */
  .learn-shell { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; padding: 0 1.25rem; }

  /* The contents becomes a strip that sticks under the nav, so jumping between chapters
     never means scrolling back to the top of the page. */
  .learn-toc {
    min-width: 0;
    /* Flush with the bottom of the fixed nav — 80px is what .nav measures here, and any
       less tucks the strip's top edge underneath it. */
    top: 80px;
    z-index: 50;
    margin: 0 -1.25rem;
    padding: 0.6rem 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  .learn-toc-label { display: none; }
  .learn-toc-list {
    flex-direction: row;
    gap: 0.4rem;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 0 1.25rem;
  }
  .learn-toc-list::-webkit-scrollbar { display: none; }
  .learn-toc-link {
    flex-shrink: 0;
    border-left: none;
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 0.35rem 0.8rem;
    white-space: nowrap;
  }
  .learn-toc-link[data-active="true"] { border-color: var(--accent); }
  .learn-toc-title { display: none; }
  .learn-toc-num { font-size: 0.78rem; }
  /* With the titles hidden the strip would be a row of bare numbers, so the active
     chapter shows its name. */
  .learn-toc-link[data-active="true"] .learn-toc-title { display: inline; }

  .learn-chapter { scroll-margin-top: 144px; padding-bottom: 2.5rem; margin-bottom: 2.5rem; }
}
`;

export default Learn;
