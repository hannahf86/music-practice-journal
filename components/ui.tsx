// components/ui.tsx — shared web UI primitives (Button, Field, Card, Pill, Sheet, etc.)
import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  type = 'button',
  block,
  className = '',
}: {
  title: string;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  block?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${block ? 'btn-block' : ''} ${className}`}
    >
      {loading ? '…' : title}
    </button>
  );
}

export function Field({
  label,
  error,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="field">
      {label ? <label className="label">{label}</label> : null}
      <input className={`input ${error ? 'input--error' : ''} ${className}`} {...props} />
      {error ? <span className="caption text-error">{error}</span> : null}
    </div>
  );
}

export function Textarea({
  label,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="field">
      {label ? <label className="label">{label}</label> : null}
      <textarea className={`textarea ${className}`} {...props} />
    </div>
  );
}

export function Card({
  children,
  onClick,
  variant,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'accent' | 'success';
  className?: string;
}) {
  const cls = `card ${variant ? `card--${variant}` : ''} ${onClick ? 'card--pressable' : ''} ${className}`;
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function Pill({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'neutral' | 'success' | 'warning' | 'primary';
}) {
  return <span className={`pill pill--${tone}`}>{text}</span>;
}

export function EmptyState({ emoji, text }: { emoji?: string; text: string }) {
  return (
    <div className="empty">
      {emoji ? <span className="empty-emoji">{emoji}</span> : null}
      <p className="body muted">{text}</p>
    </div>
  );
}

export function Divider() {
  return <hr className="divider" />;
}

// Back link for detail screens (uses browser history).
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="caption text-primary-c"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
    >
      ‹ Back
    </button>
  );
}

// Bottom-sheet modal used for add/edit flows.
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
