import { LogOut, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { GlassNavigation } from './GlassPrimitives.jsx';

export default function GlassSidebar({ navItems, page, role, mobileNavOpen, onNavigate, onLogout, onClose }) {
  return (
    <aside className={`glass-sidebar${mobileNavOpen ? ' is-open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-brand-row">
        <button className="sidebar-brand" type="button" onClick={() => onNavigate(role === 'company' ? 'company' : role === 'admin' ? 'admin' : 'dashboard')} aria-label="Go to dashboard">
          <Logo variant="navigation" />
        </button>
        {mobileNavOpen ? <button className="sidebar-close icon-button" type="button" onClick={onClose} aria-label="Close navigation"><X size={18} /></button> : null}
      </div>
      <p className="sidebar-label">WORKSPACE</p>
      <GlassNavigation className="sidebar-nav">
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} className={page === id ? 'active' : ''} type="button" onClick={() => onNavigate(id)} aria-current={page === id ? 'page' : undefined}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            {id === 'notifications' && badge > 0 ? <small className="nav-count">{badge > 99 ? '99+' : badge}</small> : null}
          </button>
        ))}
      </GlassNavigation>
      <div className="sidebar-bottom">
        <button className="sidebar-logout" type="button" onClick={onLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
