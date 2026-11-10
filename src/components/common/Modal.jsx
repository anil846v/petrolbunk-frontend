import { memo, useEffect } from 'react';
import { X } from 'lucide-react';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = memo(function Modal({ open, onClose, title, children, size = 'md' }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col my-auto overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-border flex-shrink-0 bg-white">
          <h3 id="modal-title" className="text-base sm:text-lg font-semibold text-neutral-text">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-muted hover:text-neutral-text transition-colors rounded-lg p-1.5 hover:bg-neutral-bg"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
});

export default Modal;
