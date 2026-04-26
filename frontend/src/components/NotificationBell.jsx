import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Calendar, X } from 'lucide-react';
import './NotificationBell.css';

const NotificationBell = ({ count }) => {
  const { notifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (rentOrderId) => {
    navigate(`/rents/${rentOrderId}`);
    setIsOpen(false);
  };

  return (
    <div className="notification-bell">
      <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {count > 0 && <span className="bell-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifikasi</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">Tidak ada notifikasi</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.rent_order_id}
                  className={`notification-item notification-${item.type}`}
                  onClick={() => handleNotificationClick(item.rent_order_id)}
                >
                  <div className="notification-icon">
                    {item.type === 'overdue' ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Calendar size={16} />
                    )}
                  </div>
                  <div className="notification-content">
                    <div className="notification-client">{item.client_name}</div>
                    <div className="notification-date">
                      {item.type === 'overdue' ? 'Terlambat' : 'Segera'} - {item.rent_end}
                    </div>
                  </div>
                  <span className={`notification-badge badge-${item.type}`}>
                    {item.type === 'overdue' ? 'Terlambat' : 'Segera'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="notification-overlay" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default NotificationBell;