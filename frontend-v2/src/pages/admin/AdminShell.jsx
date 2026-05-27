import { AlertTriangle, Bell, ChevronRight, Clock, Info, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { adminNav } from '../../constants/ui.js';
import { LocaleButton, Metric, StatusPill } from '../../components/shared.jsx';
import { getAdminCopy, getAdminMetrics, getAdminTitle, localizedData, resolveTagline } from '../../lib/rental-utils.js';
import CatalogueAdmin from './CatalogueAdmin.jsx';
import ClientsAdmin from './ClientsAdmin.jsx';
import RentalsAdmin from './RentalsAdmin.jsx';
import RequestsAdmin from './RequestsAdmin.jsx';
import SettingsAdmin from './SettingsAdmin.jsx';

export default function AdminShell(props) {
  const { section = 'requests' } = useParams();
  const { locale, setLocale, t, settings, rentals, notifications, setStaffSession } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    document.body.classList.remove('customer-page');
    document.body.classList.add('admin-page');
    document.title = t('document.adminTitle');
  }, [t, section]);

  const metrics = getAdminMetrics(rentals);
  const activeNotifications = notifications.filter((notification) => notification.resolved !== true);
  const unresolvedNotifications = activeNotifications.length;

  if (section === 'notifications') {
    return <Navigate to="/admin/requests" replace />;
  }

  return (
    <>
      <a className="skip-link" href="#admin-content">
        {t('common.skip')}
      </a>
      <div className="ops-shell">
        <button className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} type="button" aria-label={t('common.close')} onClick={() => setSidebarOpen(false)} />
        <aside className={`ops-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label={t('admin.sidebar.aria')}>
          <Link className="brand" to="/admin/requests" aria-label={t('brand.adminAria')}>
            <span className="brand-mark">CR</span>
            <span>
              <strong>{settings.brandName}</strong>
              <small>{resolveTagline(settings, 'staff', t)}</small>
            </span>
          </Link>
          <nav className="workspace-nav">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to={item.path} key={item.id} onClick={() => setSidebarOpen(false)}>
                  <Icon aria-hidden="true" />
                  <span>{t(item.key)}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="sidebar-card">
            <StatusPill type="custom" value={t('admin.sidebar.stale')} tone="warning" icon={Clock} />
            <p>{t('admin.sidebar.copy')}</p>
          </div>
        </aside>

        <main className="ops-main" id="admin-content">
          <header className="ops-header">
            <div className="ops-title-row">
              <button className="admin-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label={t('admin.sidebar.aria')}>
                <Menu aria-hidden="true" />
              </button>
              <div>
                <span className="section-kicker">{t('admin.header.kicker')}</span>
                <h1>{getAdminTitle(section, t)}</h1>
                <p>{getAdminCopy(section, t)}</p>
              </div>
            </div>
            <div className="ops-header-actions">
              <LocaleButton locale={locale} setLocale={setLocale} t={t} />
              <div className="notification-popover">
                <button
                  className="notification-nav-button"
                  type="button"
                  aria-expanded={notificationsOpen}
                  aria-label={t('admin.notifications.headerAria', { count: unresolvedNotifications })}
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  {notificationsOpen ? <X aria-hidden="true" /> : <Bell aria-hidden="true" />}
                  {unresolvedNotifications > 0 ? <b>{unresolvedNotifications}</b> : null}
                </button>
                {notificationsOpen ? (
                  <div className="notification-popover-panel" role="dialog" aria-label={t('admin.notifications.open')}>
                    <div className="notification-popover-head">
                      <strong>{t('admin.notifications.short')}</strong>
                      <span>{t('admin.notifications.unresolvedCount', { count: unresolvedNotifications })}</span>
                    </div>
                    {activeNotifications.length === 0 ? (
                      <p className="notification-empty">{t('admin.notifications.empty')}</p>
                    ) : (
                      activeNotifications.map((notification) => {
                        const Icon = notificationToneIcon(notification.tone);
                        return (
                          <Link
                            className="notification-popover-item"
                            to={notificationTarget(notification)}
                            key={notification.id}
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <span className={`notification-severity ${notification.tone}`}>
                              <Icon aria-hidden="true" />
                              {t(`admin.notifications.tone.${notification.tone}`)}
                            </span>
                            <div>
                              <strong>{localizedData(notification, 'title', t)}</strong>
                              <p>{localizedData(notification, 'copy', t)}</p>
                            </div>
                            <span className="notification-context">
                              {t('admin.notifications.context')}
                              <ChevronRight aria-hidden="true" />
                            </span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>
              <button className="outline-button" type="button" onClick={() => setStaffSession({ isAuthenticated: false, username: '' })}>
                {t('staff.logout')}
              </button>
            </div>
          </header>

          <section className="ops-metrics" aria-label={t('admin.metrics.aria')}>
            <Metric value={metrics.requested} title={t('admin.metrics.new')} copy={t('admin.metrics.newCopy')} to="/admin/requests?tab=all&sort=stale" />
            <Metric value={metrics.ready} title={t('admin.metrics.pickup')} copy={t('admin.metrics.pickupCopy')} to="/admin/rentals?status=ready" />
            <Metric value={metrics.returnedOpen} title={t('admin.metrics.returned')} copy={t('admin.metrics.returnedCopy')} to="/admin/requests?tab=returned" />
            <Metric value={metrics.overdue} title={t('admin.metrics.overdue')} copy={t('admin.metrics.overdueCopy')} to="/admin/rentals?status=on_rent" />
          </section>

          {section === 'requests' ? <RequestsAdmin {...props} /> : null}
          {section === 'rentals' ? <RentalsAdmin {...props} /> : null}
          {section === 'catalogue' ? <CatalogueAdmin {...props} /> : null}
          {section === 'clients' ? <ClientsAdmin {...props} /> : null}
          {section === 'settings' ? <SettingsAdmin {...props} /> : null}
        </main>
      </div>
    </>
  );
}

function notificationToneIcon(tone) {
  if (tone === 'danger') return AlertTriangle;
  if (tone === 'warning') return Clock;
  return Info;
}

function notificationTarget(notification) {
  if (notification.targetRoute) return notification.targetRoute;
  const text = `${notification.titleId ?? ''} ${notification.copyId ?? ''} ${notification.titleEn ?? ''} ${notification.copyEn ?? ''}`;
  const reference = text.match(/CR-\d+/i)?.[0];
  if (reference) return `/admin/rentals?reference=${reference.toUpperCase()}`;
  if (notification.tone === 'warning') return '/admin/requests';
  return '/admin/rentals';
}
