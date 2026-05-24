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
    <div className="flex items-center justify-center">
      <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
        <Badge.Anchor>
          <Button isIconOnly variant="ghost" aria-label="Notifikasi" onPress={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full">
            <Bell size={20} className="text-[var(--muted)]" />
          </Button>
          {count > 0 && (
            <Badge color="danger" size="sm" placement="top-right" className="border-2 border-[var(--surface)]">
              {count}
            </Badge>
          )}
        </Badge.Anchor>

        <Popover.Content className="p-0 border border-[var(--border)] shadow-xl overflow-hidden rounded-xl max-sm:max-w-[calc(100vw-16px)]">
          <div className="w-80 max-sm:w-[calc(100vw-32px)] bg-[var(--surface)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--border)]/10">
              <h3 className="text-sm font-bold">Notifikasi</h3>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsOpen(false)}
                aria-label="Tutup notifikasi"
                data-slot="close-button"
              >
                <X size={16} data-slot="close-icon" />
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-xs text-[var(--muted)]">
                  Tidak ada notifikasi
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.rent_order_id}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--border)]/30 transition-colors border-b border-[var(--border)]/50 last:border-0"
                    onClick={() => handleNotificationClick(item.rent_order_id)}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                      item.type === 'overdue' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                    }`}>
                      {item.type === 'overdue' ? <AlertTriangle size={16} /> : <Calendar size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.client_name}</div>
                      <div className="text-[10px] text-[var(--muted)] uppercase">
                        {item.type === 'overdue' ? 'Terlambat' : 'Segera'} • {item.rent_end}
                      </div>
                    </div>
                    <Chip size="sm" variant="soft" color={item.type === 'overdue' ? 'danger' : 'warning'}>
                      <Chip.Label>{item.type === 'overdue' ? 'Late' : 'Soon'}</Chip.Label>
                    </Chip>
                  </div>
                ))
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
};

export default NotificationBell;
