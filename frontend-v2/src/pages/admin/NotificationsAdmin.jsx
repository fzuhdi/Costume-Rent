import { AlertTriangle, Bell, Check } from 'lucide-react';
import { localizedData } from '../../lib/rental-utils.js';

export default function NotificationsAdmin({ t, notifications, setNotifications }) {
  const unresolved = notifications.filter((notification) => !notification.resolved);

  return (
    <section className="base-window notification-window">
      <div className="notification-window-head">
        <div>
          <span className="section-kicker">{t('admin.notifications.inboxKicker')}</span>
          <h2>{t('admin.notifications.inboxTitle')}</h2>
          <p>{t('admin.notifications.inboxCopy')}</p>
        </div>
        <strong>{t('admin.notifications.unresolvedCount', { count: unresolved.length })}</strong>
      </div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <article className={`notification-item ${notification.resolved ? 'resolved' : ''}`} key={notification.id}>
            <span className={`notification-severity ${notification.tone}`}>
              {notification.tone === 'danger' ? <AlertTriangle aria-hidden="true" /> : <Bell aria-hidden="true" />}
              {t(`admin.notifications.tone.${notification.tone}`)}
            </span>
            <div>
              <strong>{localizedData(notification, 'title', t)}</strong>
              <p>{localizedData(notification, 'copy', t)}</p>
            </div>
            {notification.resolved ? (
              <span className="status-badge success">
                <Check aria-hidden="true" />
                <span className="status-badge-label">{t('admin.notifications.resolved')}</span>
              </span>
            ) : (
              <button className="outline-button" type="button" onClick={() => setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, resolved: true } : item)))}>
                {t('admin.notifications.resolve')}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
