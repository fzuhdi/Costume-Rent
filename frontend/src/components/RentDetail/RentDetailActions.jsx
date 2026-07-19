import { Card, Button } from '@heroui/react';

export default function RentDetailActions({
  rent,
  openUpgradeModal,
  setIsCancelOpen,
  openRentModal,
  setIsExtendOpen,
  openReturnModal,
  setIsRollbackOpen,
  handleReceive
}) {
  return (
    <Card>
      <Card.Content>
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {rent.status === 'pending' && (
            <>
              <Button color="primary" onPress={openUpgradeModal}>Book</Button>
              <Button color="danger" variant="flat" onPress={() => setIsCancelOpen(true)}>Cancel</Button>
            </>
          )}
          {rent.status === 'booked' && (
            <>
              <Button color="success" className="text-white font-bold" onPress={openRentModal}>Pickup</Button>
              <Button color="danger" variant="flat" onPress={() => setIsCancelOpen(true)}>Cancel</Button>
            </>
          )}
          {(rent.status === 'rented' || rent.status === 'overdue') && (
            <>
              <Button color="secondary" onPress={() => setIsExtendOpen(true)}>Extend</Button>
              <Button color="primary" className="text-white font-bold" onPress={handleReceive}>Receive</Button>
              {rent.status === 'rented' && (
                <Button color="danger" variant="flat" onPress={() => setIsRollbackOpen(true)}>Rollback</Button>
              )}
            </>
          )}
          {rent.status === 'returned' && (
            <>
              <Button color="success" className="text-white font-bold" onPress={openReturnModal}>Inspect & Complete</Button>
              <Button color="danger" variant="flat" onPress={() => setIsRollbackOpen(true)}>Rollback Status</Button>
            </>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
