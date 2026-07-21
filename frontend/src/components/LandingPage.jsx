import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';

/* ── DATA ── */
const IMPORTANCE_CARDS = [
  { icon: '\u23F1\uFE0F', title: 'Reduced Wait Times', desc: 'Critically ill patients receive immediate care without unnecessary delays.' },
  { icon: '\uD83D\uDEA8', title: 'Emergency Prioritization', desc: 'Ensures emergency cases are identified and treated first.' },
  { icon: '\uD83C\uDFE5', title: 'Hospital Efficiency', desc: 'Streamlines patient flow and improves overall hospital operations.' },
  { icon: '\uD83D\uDC65', title: 'Volume Management', desc: 'Helps healthcare professionals manage large patient volumes effectively.' },
  { icon: '\uD83D\uDC8A', title: 'Better Outcomes', desc: 'Supports better patient outcomes through timely intervention.' },
  { icon: '\uD83E\uDD16', title: 'Intelligent Prioritization', desc: 'Reduces healthcare overload using AI-driven intelligent prioritization.' },
];

const INDIA_CARDS = [
  { icon: '\uD83C\uDFE5', title: 'Hospitals' },
  { icon: '\uD83C\uDFE5', title: 'Primary Health Centres' },
  { icon: '\uD83D\uDE91', title: 'Emergency Services' },
  { icon: '\uD83C\uDF0D', title: 'Rural Healthcare' },
  { icon: '\uD83D\uDCF1', title: 'Digital Health Records' },
  { icon: '\u2695\uFE0F', title: 'Nationwide Accessibility' },
];

const FEATURES = [
  { icon: '\uD83E\uDDE0', title: 'AI-Based Patient Prioritization', desc: 'Leverage AI to evaluate patient symptoms and assign urgency scores in real-time.' },
  { icon: '\uD83D\uDCCB', title: 'Real-Time Medical Records', desc: 'Access and update patient medical records instantly across the system.' },
  { icon: '\uD83D\uDCC5', title: 'Patient Calendar', desc: 'Schedule, manage, and track patient appointments with persistent storage.' },
  { icon: '\uD83D\uDD12', title: 'Secure Healthcare Data', desc: 'Enterprise-grade security ensuring patient data remains protected at all times.' },
  { icon: '\uD83E\uDE7A', title: 'Doctor Dashboard', desc: 'Comprehensive dashboard for doctors to monitor patient queues and analytics.' },
  { icon: '\uD83D\uDEA8', title: 'Fast Emergency Response', desc: 'Rapid triage assessment enabling faster emergency response times.' },
  { icon: '\uD83D\uDCCA', title: 'Smart Analytics', desc: 'Data-driven insights to improve healthcare delivery and decision-making.' },
  { icon: '\uD83D\uDCF1', title: 'Responsive Design', desc: 'Access the platform from any device \u2014 desktop, tablet, or mobile.' },
];

const WHY_CARDS = [
  { icon: '\u2705', title: 'Reliable', desc: 'Built on robust architecture ensuring 99.9% uptime for critical healthcare operations.' },
  { icon: '\uD83D\uDEE1\uFE0F', title: 'Secure', desc: 'End-to-end encryption and compliance with healthcare data protection standards.' },
  { icon: '\u26A1', title: 'Fast', desc: 'Sub-second triage assessments powered by optimized AI inference pipelines.' },
  { icon: '\uD83D\uDCC8', title: 'Scalable', desc: 'Designed to scale from single clinics to nationwide healthcare networks.' },
];

const STATS = [
  { target: 50000, suffix: '+', label: 'Patients Managed' },
  { target: 200, suffix: '+', label: 'Hospitals Supported' },
  { target: 2, suffix: 's', label: 'Average Response Time' },
  { target: 500, suffix: '+', label: 'Healthcare Facilities' },
];

/* ── INTERSECTION OBSERVER HOOK ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, isVisible];
}

/* ── ANIMATED COUNTER ── */
function AnimatedCounter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useInView(0.3);
  useEffect(() => {
    if (!isVisible) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [isVisible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── INDIA MAP SVG ── */
function IndiaMapSVG() {
  return (
    <svg viewBox="0 0 500 600" style={{ width: '100%', maxWidth: 400, height: 'auto' }}>
      <path
        d="M200,50 Q250,30 280,50 L310,80 Q340,90 350,120 L360,160 Q380,180 390,220 L400,260 Q410,300 390,340 L370,380 Q350,420 320,440 L290,460 Q270,490 260,520 L250,550 Q240,560 230,550 L220,520 Q200,490 180,470 L150,440 Q120,410 110,380 L100,340 Q90,300 100,260 L110,220 Q120,180 140,150 L160,120 Q170,90 190,70 Z"
        fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="2" strokeDasharray="6 4"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="100" dur="20s" repeatCount="indefinite" />
      </path>
      {[[200,120],[300,200],[250,300],[180,250],[320,350],[240,420]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="rgba(96,165,250,0.6)">
          <animate attributeName="r" values="3;6;3" dur={`${2+i*0.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {[[200,120,300,200],[300,200,250,300],[250,300,320,350],[180,250,240,420]].map(([x1,y1,x2,y2],i) => (
        <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(96,165,250,0.15)" strokeWidth="1">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur={`${3+i}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  );
}

/* ── WAVE DIVIDER ── */
function Wave({ from, to }) {
  return (
    <div className="lp-wave" style={{ background: from }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,80 L0,80 Z" fill={to} />
      </svg>
    </div>
  );
}

/* ══════════ MAIN COMPONENT ══════════ */
export default function LandingPage({ onEnter }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const [aboutRef, aboutVis] = useInView();
  const [impRef, impVis] = useInView();
  const [indiaRef, indiaVis] = useInView();
  const [featRef, featVis] = useInView();
  const [whyRef, whyVis] = useInView();
  const [statsRef, statsVis] = useInView();
  const [ctaRef, ctaVis] = useInView();

  return (
    <div className="landing-root">
      {/* NAVBAR */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="#hero" className="lp-nav-logo">
          <div className="lp-nav-logo-icon">{'\u271A'}</div>
          VITALIS <span style={{ color: 'var(--med-blue)' }}>/ TriageAI</span>
        </a>
        <div className="lp-nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#stats">Impact</a>
          <a href="#cta">Contact</a>
          <button className="lp-nav-cta" onClick={onEnter}>Open Dashboard {'\u2192'}</button>
        </div>
      </nav>

      {/* SECTION 1 - HERO */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-orb lp-hero-orb-1" />
          <div className="lp-hero-orb lp-hero-orb-2" />
          <img src="/images/hero_medical.png" alt="" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            <span>AI-Powered Healthcare</span>
          </div>
          <h1>
            <span className="blue">AI-Powered</span> Smart Medical<br />Triage System
          </h1>
          <p className="lp-hero-sub">
            Providing intelligent patient prioritization, efficient healthcare management,
            and faster clinical decision support.
          </p>
          <div className="lp-hero-btns">
            <button className="lp-btn-primary" onClick={onEnter}>
              {'\uD83D\uDE80'} Get Started
            </button>
            <a href="#about" className="lp-btn-secondary" style={{ textDecoration: 'none' }}>
              Learn More {'\u2193'}
            </a>
          </div>
        </div>
      </section>

      <Wave from="transparent" to="#ffffff" />

      {/* SECTION 2 - ABOUT TRIAGE NURSE */}
      <section className="lp-section lp-section-white" id="about">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-tag">About Triage</div>
            <h2>What is a Triage Nurse?</h2>
          </div>
          <div ref={aboutRef} className={`lp-about-grid lp-fade ${aboutVis ? 'visible' : ''}`}>
            <div className="lp-about-text">
              <p>
                A triage nurse is the first healthcare professional who evaluates patients when they
                arrive at a hospital or emergency department. Instead of treating patients in the order
                they arrive, the triage nurse assesses symptoms, medical history, and severity of illness
                to determine who requires immediate medical attention.
              </p>
              <h3>Why is Triage Important Today?</h3>
              <p>
                In modern healthcare, efficient triage is essential to ensure that critically ill patients
                receive care first, hospitals operate at peak efficiency, and healthcare systems are not
                overwhelmed during high-demand periods.
              </p>
            </div>
            <div className="lp-about-img">
              <img src="/images/triage_nurse.png" alt="Triage nurse assessing patients" />
            </div>
          </div>
          <div ref={impRef} className={`lp-importance-grid lp-fade ${impVis ? 'visible' : ''}`}>
            {IMPORTANCE_CARDS.map((c, i) => (
              <div className="lp-imp-card" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="lp-imp-icon">{c.icon}</div>
                <div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#ffffff" to="#0f172a" />

      {/* SECTION 3 - DIGITAL HEALTHCARE INDIA */}
      <section className="lp-section lp-section-dark lp-india" id="india">
        <div className="lp-india-bg"><IndiaMapSVG /></div>
        <div className="lp-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="lp-section-header">
            <div className="lp-tag">Digital Healthcare</div>
            <h2>Supporting Digital Healthcare Across India</h2>
            <p>
              This platform is designed to support digital healthcare initiatives and can be deployed
              in hospitals, clinics, primary health centres, mobile medical camps, and healthcare
              institutions across India. It enables standardized patient assessment, faster triage,
              secure digital records, and improved healthcare accessibility.
            </p>
          </div>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: 32, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
            Designed to align with India&#39;s digital healthcare vision. Suitable for deployment across
            healthcare institutions. Can support government and private healthcare organizations.
            Scalable for nationwide deployment.
          </p>
          <div ref={indiaRef} className={`lp-india-grid lp-fade ${indiaVis ? 'visible' : ''}`}>
            {INDIA_CARDS.map((c, i) => (
              <div className="lp-india-card" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="lp-india-card-icon">{c.icon}</div>
                <h4>{c.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#0f172a" to="#f0f7ff" />

      {/* SECTION 4 - FEATURES */}
      <section className="lp-section lp-section-light" id="features">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-tag">Platform Features</div>
            <h2>Everything You Need for Smart Triage</h2>
            <p>Comprehensive tools designed for modern healthcare delivery and intelligent patient management.</p>
          </div>
          <div ref={featRef} className={`lp-features-grid lp-fade ${featVis ? 'visible' : ''}`}>
            {FEATURES.map((f, i) => (
              <div className="lp-feature-card" key={i} style={{ transitionDelay: `${i * 0.06}s` }}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#f0f7ff" to="#ffffff" />

      {/* SECTION 5 - WHY CHOOSE US */}
      <section className="lp-section lp-section-white" id="why">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-tag">Why Choose Us</div>
            <h2>Built for Healthcare Excellence</h2>
            <p>Our platform is engineered with the principles that matter most in healthcare technology.</p>
          </div>
          <div ref={whyRef} className={`lp-why-grid lp-fade ${whyVis ? 'visible' : ''}`}>
            {WHY_CARDS.map((c, i) => (
              <div className="lp-why-card" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="lp-why-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#ffffff" to="#f0f7ff" />

      {/* SECTION 6 - STATISTICS */}
      <section className="lp-section lp-section-light" id="stats">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-tag">Our Impact</div>
            <h2>Making a Difference in Healthcare</h2>
          </div>
          <div ref={statsRef} className={`lp-stats-grid lp-fade ${statsVis ? 'visible' : ''}`}>
            {STATS.map((s, i) => (
              <div className="lp-stat-card" key={i}>
                <div className="lp-stat-num">
                  <AnimatedCounter target={s.target} suffix={s.suffix} />
                </div>
                <div className="lp-stat-label">{s.label}</div>
                <div className="lp-stat-bar" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 - FINAL CTA */}
      <section className="lp-cta" id="cta">
        <img src="/images/cta_medical.png" alt="" className="lp-cta-img" />
        <div ref={ctaRef} className={`lp-cta-content lp-fade ${ctaVis ? 'visible' : ''}`}>
          <div className="lp-tag" style={{ marginBottom: 20 }}>Get Started Today</div>
          <h2>Transforming Healthcare Through<br />Intelligent Triage</h2>
          <p>
            Deliver faster patient assessment, smarter decision-making, and improved healthcare
            experiences through AI-powered triage technology.
          </p>
          <div className="lp-cta-btns">
            <button className="lp-btn-primary" onClick={onEnter}>
              {'\uD83D\uDE80'} Launch System
            </button>
            <a href="mailto:contact@triageai.health" className="lp-btn-secondary" style={{ textDecoration: 'none' }}>
              {'\u2709\uFE0F'} Contact Team
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div>
            <div className="lp-footer-brand">VITALIS / TriageAI</div>
            <p style={{ fontSize: '0.85rem', maxWidth: 300, lineHeight: 1.6 }}>
              AI-powered smart medical triage system for modern healthcare delivery.
            </p>
          </div>
          <div className="lp-footer-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#cta">Contact</a>
            <a href="#terms">Terms of Use</a>
          </div>
        </div>
        <div className="lp-footer-copy">
          &copy; 2026 Smart Medical Triage System. All rights reserved. For demonstration &amp; clinical decision-support only.
        </div>
      </footer>
    </div>
  );
}
