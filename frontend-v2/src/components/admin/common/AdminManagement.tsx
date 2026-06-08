import { Plus, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function AdminFeatureGrid({ className = '', detailOpen = false, children }: { className?: string; detailOpen?: boolean; children: ReactNode }) {
  return (
    <div className={`admin-feature-grid ${className} ${detailOpen ? 'detail-open' : ''}`.trim()}>
      {children}
    </div>
  );
}

export function AdminListWindow({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`base-window management-window ${className}`.trim()}>
      {children}
    </section>
  );
}

export function AdminViewBar({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`view-bar ${className}`.trim()}>
      {children}
    </div>
  );
}

export function AdminCreateAction({ label, open, controls, onToggle, className = '' }: { label: string; open: boolean; controls: string; onToggle: () => void; className?: string }) {
  return (
    <button
      className={`primary-button desktop-create-action ${className}`.trim()}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      <Plus aria-hidden="true" />
      {label}
    </button>
  );
}

export function AdminCreateFab({ label, open, controls, onToggle, className = '' }: { label: string; open: boolean; controls: string; onToggle: () => void; className?: string }) {
  return (
    <button
      className={`primary-button mobile-fab ${className}`.trim()}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      onClick={onToggle}
    >
      <Plus aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </button>
  );
}

export function AdminCreatePanel({
  id,
  kicker,
  title,
  closeLabel,
  onClose,
  className = '',
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`content-panel compact-panel ${className}`.trim()} id={id}>
      <div className="panel-form-head">
        <div>
          <span className="section-kicker">{kicker}</span>
          <h3>{title}</h3>
        </div>
        <button className="icon-button" type="button" aria-label={closeLabel} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  );
}
