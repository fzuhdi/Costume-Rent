import { Plus, X } from 'lucide-react';

export function AdminFeatureGrid({ className = '', detailOpen = false, children }) {
  return (
    <div className={`admin-feature-grid ${className} ${detailOpen ? 'detail-open' : ''}`.trim()}>
      {children}
    </div>
  );
}

export function AdminListWindow({ className = '', children }) {
  return (
    <section className={`base-window management-window ${className}`.trim()}>
      {children}
    </section>
  );
}

export function AdminViewBar({ className = '', children }) {
  return (
    <div className={`view-bar ${className}`.trim()}>
      {children}
    </div>
  );
}

export function AdminCreateAction({ label, open, controls, onToggle, className = '' }) {
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

export function AdminCreateFab({ label, open, controls, onToggle, className = '' }) {
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

export function AdminCreatePanel({ id, kicker, title, closeLabel, onClose, className = '', children }) {
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
