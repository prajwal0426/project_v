import { forwardRef, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

function classes(...values) {
  return values.filter(Boolean).join(' ');
}

export function GlassCard({ as: Element = 'section', className, ...props }) {
  return <Element className={classes('glass', className)} {...props} />;
}

export function GlassButton({ variant = 'ghost', className, type = 'button', ...props }) {
  return <button className={classes('glass-button', variant, className)} type={type} {...props} />;
}

export const GlassInput = forwardRef(function GlassInput({ as: Element = 'input', className, ...props }, ref) {
  return <Element ref={ref} className={classes('glass-input-control', className)} {...props} />;
});

export function GlassTable({ className, children, ...props }) {
  return <div className={classes('admin-table', 'glass', className)} {...props}>{children}</div>;
}

export function GlassNavigation({ className, children, ...props }) {
  return <nav className={classes('glass-navigation', className)} {...props}>{children}</nav>;
}

export function GlassDropdown({ open, onOpenChange, className, children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) onOpenChange(false);
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      onOpenChange(false);
      rootRef.current?.querySelector('[aria-haspopup="menu"]')?.focus();
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  return <div className={classes('profile-menu-wrap', className)} ref={rootRef}>{children}</div>;
}

export function GlassModal({ onClose, labelledBy, className, closeLabel = 'Close dialog', children }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )];
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div className="legal-modal-layer" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <article
        className={classes('legal-modal', 'glass', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={dialogRef}
      >
        <button className="auth-close icon-button" type="button" onClick={onClose} aria-label={closeLabel}><X size={18} /></button>
        {children}
      </article>
    </div>
  );
}
