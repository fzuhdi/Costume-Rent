import { useState } from 'react';
import { Card, Button, Modal } from '@heroui/react';
import { Clock } from 'lucide-react';

export default function RentDetailActivityLog({
  rent,
  groupedLogs,
  renderLogContent,
  formatDateTime,
}) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <>
      <Card>
        <Card.Content>
          <h3 className="text-lg font-semibold mb-3">Activity Log</h3>
          <div className="flex flex-col gap-3 relative before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-slate-200 ml-1">
            {groupedLogs.slice(0, 5).map((group) => (
              <div key={group.timestamp || group.logs[0]?.id} className="flex gap-3 relative z-10 text-xs">
                <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0">
                  <Clock size={12} className="text-slate-400" />
                </div>
                <div className="flex-1 pb-1">
                  <p className="font-semibold text-slate-700">
                    {group.logs.length > 1 ? 'Order Updated' : (group.logs[0].action_type === 'UPDATED' && (group.logs[0].new_value === 'updated' || !group.logs[0].old_value) ? 'Order Updated' : group.logs[0].action_type)}
                  </p>
                  {group.logs.length > 1 ? (
                    <ul className="list-disc list-inside text-slate-500 mt-1 space-y-0.5">
                      {group.logs.map(log => (
                        <li key={log.id}>
                          {log.action_type !== 'UPDATED' && log.action_type !== 'FEE_UPDATE' && log.action_type !== 'PRICE_OVERRIDE' && <span className="font-semibold">{log.action_type}: </span>}
                          {renderLogContent(log)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">{renderLogContent(group.logs[0])}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(group.logs[0]?.created_at)}</p>
                </div>
              </div>
            ))}
            {rent.activity_logs?.length > 5 && (
              <Button size="sm" variant="light" className="text-xs font-semibold" onPress={() => setIsHistoryOpen(true)}>
                View Full History
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>

      <Modal.Backdrop isOpen={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg max-h-[80vh] overflow-y-auto bg-[var(--surface)] border border-default-200">
            <Modal.Header><Modal.Heading>Activity Log History</Modal.Heading></Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-3 relative before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-slate-200 ml-1">
                {groupedLogs.map((group) => (
                  <div key={group.timestamp || group.logs[0]?.id} className="flex gap-3 relative z-10 text-xs">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0">
                      <Clock size={12} className="text-slate-400" />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="font-semibold text-slate-700">
                        {group.logs.length > 1 ? 'Order Updated' : (group.logs[0].action_type === 'UPDATED' && (group.logs[0].new_value === 'updated' || !group.logs[0].old_value) ? 'Order Updated' : group.logs[0].action_type)}
                      </p>
                      {group.logs.length > 1 ? (
                        <ul className="list-disc list-inside text-slate-500 mt-1 space-y-0.5">
                          {group.logs.map(log => (
                            <li key={log.id}>
                              {log.action_type !== 'UPDATED' && log.action_type !== 'FEE_UPDATE' && log.action_type !== 'PRICE_OVERRIDE' && <span className="font-semibold">{log.action_type}: </span>}
                              {renderLogContent(log)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500">{renderLogContent(group.logs[0])}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(group.logs[0]?.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => setIsHistoryOpen(false)}>Tutup</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
