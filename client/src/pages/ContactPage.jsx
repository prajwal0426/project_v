import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import PublicNavigation from '../components/PublicNavigation.jsx';
import CinematicScene from '../components/CinematicScene.jsx';

const contactOptions = [
  ['SUPPORT', 'support@vertex.com', Mail],
  ['PHONE', '+91 98765 43210', Phone],
  ['LOCATION', 'India', MapPin]
];

export default function ContactPage({ setPage }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setStatus('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    setStatus('Contact delivery is not configured yet. Your message has not been sent.');
  }

  return (
    <main className="public-page contact-page">
      <PublicNavigation activePage="contact" setPage={setPage} />
      <CinematicScene className="public-cinematic-scene" />
      <div className="public-page-grid" aria-hidden="true" />

      <section className="contact-hero public-section">
        <p className="public-kicker">VERTEX SUPPORT</p>
        <h1>CONTACT <span>VERTEX</span></h1>
        <p className="public-lead">Have a question, suggestion, or need help? We&apos;re here to help.</p>
      </section>

      <section className="public-section contact-options" aria-label="Contact options">
        {contactOptions.map(([title, detail, Icon]) => (
          <article className="contact-option" key={title}>
            <Icon size={22} aria-hidden="true" />
            <p>{title}</p>
            <strong>{detail}</strong>
          </article>
        ))}
      </section>

      <section className="public-section contact-form-section">
        <div className="contact-form-copy">
          <p className="public-kicker">SEND A MESSAGE</p>
          <h2>We&apos;re listening.</h2>
          <p>Share the detail and the VERTEX team will be ready to connect when support delivery is enabled.</p>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>Name<input name="name" type="text" value={form.name} onChange={updateField} autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /></label>
          <label className="contact-form-wide">Subject<input name="subject" type="text" value={form.subject} onChange={updateField} required /></label>
          <label className="contact-form-wide">Message<textarea name="message" value={form.message} onChange={updateField} rows="5" required /></label>
          {status ? <p className="contact-form-status" role="status">{status}</p> : null}
          <button className="vertex-action contact-form-wide" type="submit"><Send size={17} />Send Message</button>
        </form>
      </section>
    </main>
  );
}
