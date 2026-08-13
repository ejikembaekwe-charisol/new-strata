import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Problem from '../components/Problem';
import Technology from '../components/Technology';
import ImportShowcase from '../components/ImportShowcase';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';

const Home = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Hero />
      <Stats />
      <Problem />
      <Technology />
      <ImportShowcase />
      <Testimonials />
      <CTA />
    </>
  );
};

export default Home;
