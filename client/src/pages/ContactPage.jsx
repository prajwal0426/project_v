import { CheckCircle2, Headphones, Mail, MapPin, Phone, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import PublicNavigation from '../components/PublicNavigation.jsx';
import CinematicScene from '../components/CinematicScene.jsx';

const contactCards = [
  {
    title: 'Admin Support',
    detail: 'admin@vertex.com',
    link: 'mailto:admin@vertex.com',
    desc: 'Platform governance & enterprise inquiries',
    icon: ShieldCheck
  },
  {
    title: 'Support',
    detail: 'support@vertex.com',
    link: 'mailto:support@vertex.com',
    desc: 'General help & user assistance',
    icon: Headphones
  },
  {
    title: 'Phone',
    detail: '+91 8639563588',
    link: 'tel:+918639563588',
    desc: 'Mon – Fri, 9:00 AM – 6:00 PM IST',
    icon: Phone
  },
  {
    title: 'Location',
    detail: 'India',
    desc: 'Serving builders globally',
    icon: MapPin
  }
];

export default function ContactPage({ setPage }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (status.text) setStatus({ type: '', text: '' });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    // Simulate prompt handling
    setTimeout(() => {
      setIsSubmitting(false);
      setStatus({
        type: 'success',
        text: 'Thank you for reaching out! Your message has been received and our team will get back to you shortly.'
      });
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 600);
  }

  return (
    <main className="public-page contact-page">
      <PublicNavigation activePage="contact" setPage={setPage} />
      <CinematicScene className="public-cinematic-scene" />

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="section-header-centered">
          <div className="about-kicker-pill contact-kicker-pill">
            <Sparkles size={13} aria-hidden="true" />
            <span>VERTEX SUPPORT</span>
          </div>
          <h1 className="contact-hero-title">
            CONTACT <span className="highlight-gradient">VERTEX</span>
          </h1>
          <p className="contact-lead">
            Have a question, need assistance with your account, or looking to partner with us? Our dedicated support team is here to assist you.
          </p>
        </div>
      </section>

      {/* 4 Cards in 1 Row on desktop, 2-col on tablet, 1-col on mobile */}
      <section className="contact-cards-section" aria-label="Contact channels">
        <div className="contact-cards-grid">
          {contactCards.map(({ title, detail, link, desc, icon: Icon }) => (
            <article className="contact-card" key={title}>
              <div className="contact-card-icon-frame">
                <Icon size={22} aria-hidden="true" />
              </div>
              <p className="contact-card-title">{title}</p>
              {link ? (
                <a className="contact-card-detail" href={link}>
                  {detail}
                </a>
              ) : (
                <strong className="contact-card-detail">{detail}</strong>
              )}
              <span className="contact-card-desc">{desc}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Styled Contact Form */}
      <section className="contact-form-section">
        <div className="contact-form-card">
          <div className="contact-form-header">
            <p className="public-kicker">SEND A MESSAGE</p>
            <h2 className="contact-form-title">We&apos;re Listening</h2>
            <p className="contact-form-subtitle">
              Fill out the form below and the VERTEX team will respond within 24 hours.
            </p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>
                NAME
                <input
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={updateField}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                EMAIL
                <input
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <label className="form-full-width">
              SUBJECT
              <input
                name="subject"
                type="text"
                placeholder="What is this regarding?"
                value={form.subject}
                onChange={updateField}
                required
              />
            </label>

            <label className="form-full-width">
              MESSAGE
              <textarea
                name="message"
                placeholder="Tell us how we can help..."
                value={form.message}
                onChange={updateField}
                rows={5}
                required
              />
            </label>

            {status.text ? (
              <div className={`form-feedback-banner ${status.type}`}>
                <CheckCircle2 size={18} aria-hidden="true" />
                <p>{status.text}</p>
              </div>
            ) : null}

            <div className="form-action-row">
              <button className="vertex-action" type="submit" disabled={isSubmitting}>
                <Send size={16} aria-hidden="true" />
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Consistent Public Footer */}
      <footer className="public-footer">
        <p className="public-footer-copy">© {new Date().getFullYear()} VERTEX. All rights reserved.</p>
        <div className="public-footer-links">
          <button type="button" onClick={() => setPage('home')}>Home</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('about')}>About</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('contact')}>Contact</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('login')}>Sign In</button>
        </div>
      </footer>
    </main>
  );
}
