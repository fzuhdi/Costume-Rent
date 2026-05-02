import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Calendar, X } from 'lucide-react';
import { Popover, Button, Badge, Chip } from '@heroui/react';

const NotificationBell = ({ count }) => {
  const { notifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (rentOrderId) => {
    navigate(`/rents/${rentOrderId}`);
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger aria-label="Buka notifikasi">
        {count > 0 ? (
          <Badge content={count}>
            <Bell size={20} />
          </Badge>
        ) : (
          <Bell size={20} />
        )}
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Dialog>
          <div className="px-2 py-2 max-w-xs">
            <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold">Notifikasi</h3>
              <Button isIconOnly size="sm" variant="light" aria-label="Tutup notifikasi" onPress={() => setIsOpen(false)}>
                <X size={18} />
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--muted)]">Tidak ada notifikasi</div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.rent_order_id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--border)] transition-colors"
                    onClick={() => handleNotificationClick(item.rent_order_id)}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                        item.type === 'overdue' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {item.type === 'overdue' ? (
                        <AlertTriangle size={16} />
                      ) : (
                        <Calendar size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.client_name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {item.type === 'overdue' ? 'Terlambat' : 'Segera'} - {item.rent_end}
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      variant={item.type === 'overdue' ? 'danger-soft' : 'secondary'}
                    >
                      {item.type === 'overdue' ? 'Terlambat' : 'Segera'}
                    </Chip>
                  </div>
                ))
              )}
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
};

export default NotificationBell;