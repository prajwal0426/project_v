import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { LEGAL_DOCUMENTS } from '../services/legal.js';

export default function LegalDocumentModal({ documentType, onClose, returnFocusRef }) {
  const closeButtonRef = useRef(null);
  const legalDocument = documentType ? LEGAL_DOCUMENTS[documentType] : null;

  useEffect(() => {
    if (!legalDocument) {
      return undefined;
    }

    const previousOverflow = globalThis.document.body.style.overflow;
    globalThis.document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      globalThis.document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      returnFocusRef?.current?.focus();
    };
  }, [legalDocument, onClose, returnFocusRef]);

  if (!legalDocument) {
    return null;
  }

  return (
    <div className="legal-modal-layer" onClick={onClose} role="presentation">
      <article className="legal-modal glass" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="legal-title">
        <button ref={closeButtonRef} className="auth-close icon-button" type="button" onClick={onClose} aria-label={`Close ${legalDocument.title}`}>
          <X size={18} />
        </button>
        <p className="eyebrow">VERTEX LEGAL</p>
        <h2 id="legal-title">{legalDocument.title}</h2>
        <p>Version {legalDocument.version}</p>
        <div className="legal-document-body">
          {legalDocument.sections.map(([heading, text]) => (
            <section key={heading}>
              <h3>{heading}</h3>
              <p>{text}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
