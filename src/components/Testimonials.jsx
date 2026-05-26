import React from 'react';

const Testimonials = () => {
  return (
    <section id="customers" className="section reveal">
      <div className="section-header">
        <span className="section-label">Trust</span>
        <h2>Built for teams that move fast.</h2>
      </div>
      <div className="testimonial-grid">
        <div className="testimonial-card">
          <p>"The brand migration that was supposed to take 2 months took 2 days. Token update, done. Strata is magic."</p>
          <div className="author">
            <div className="author-info">
              <h4>James R.</h4>
              <span>Frontend Engineering Lead</span>
            </div>
          </div>
        </div>
        <div className="testimonial-card">
          <p>"Finally, production actually looks like what I designed. The drift is just gone. Designers own the visual state now."</p>
          <div className="author">
            <div className="author-info">
              <h4>Sofia C.</h4>
              <span>Design Systems Lead</span>
            </div>
          </div>
        </div>
        <div className="testimonial-card">
          <p>"We used to spend a full sprint syncing design changes. Now it happens in the background while we build features."</p>
          <div className="author">
            <div className="author-info">
              <h4>Amara K.</h4>
              <span>Lead Product Designer</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
