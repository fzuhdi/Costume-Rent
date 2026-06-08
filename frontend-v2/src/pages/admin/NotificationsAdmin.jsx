import { Check } from 'lucide-react';
import { NotificationRow, StatusPill } from '../../components/shared.jsx';
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
          <NotificationRow
            className="notification-item"
            key={notification.id}
            tone={notification.tone}
            resolved={notification.resolved}
            severityLabel={t(`admin.notifications.tone.${notification.tone}`)}
            title={localizedData(notification, 'title', t)}
            copy={localizedData(notification, 'copy', t)}
          >
            {notification.resolved ? (
              <StatusPill type="custom" value={t('admin.notifications.resolved')} tone="success" icon={Check} />
            ) : (
              <button className="outline-button" type="button" onClick={() => setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, resolved: true } : item)))}>
                {t('admin.notifications.resolve')}
              </button>
            )}
          </NotificationRow>
        ))}
      </div>
    </section>
  );
}
