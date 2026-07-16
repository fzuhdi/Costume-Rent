import React from 'react';
import { Card, Button } from '@heroui/react';

export default function RentDetailActions({
  rent,
  openUpgradeModal,
  setIsCancelOpen,
  openRentModal,
  setIsExtendOpen,
  openReturnModal,
  setIsRollbackOpen
}) {
  return (
    <Card>
      <Card.Content>
        <h2 className="text-xl font-semibold mb-4">Aksi Pesanan</h2>
        <div className="flex flex-wrap gap-3">
          {rent.status === 'draft' && (
            <>
              <Button color="primary" onPress={openUpgradeModal}>Ubah Status ke Booked</Button>
              <Button color="danger" variant="flat" onPress={() => setIsCancelOpen(true)}>Batalkan</Button>
            </>
          )}
          {rent.status === 'booked' && (
            <>
              <Button color="success" className="text-white font-bold" onPress={openRentModal}>Pickup (Mark Rented)</Button>
              <Button color="danger" variant="flat" onPress={() => setIsCancelOpen(true)}>Batalkan</Button>
            </>
          )}
          {(rent.status === 'rented' || rent.status === 'overdue') && (
            <>
              <Button color="secondary" onPress={() => setIsExtendOpen(true)}>Perpanjang Sewa</Button>
              <Button color="success" className="text-white font-bold" onPress={openReturnModal}>Konfirmasi Pengembalian</Button>
              {rent.status === 'rented' && (
                <Button color="danger" variant="flat" onPress={() => setIsRollbackOpen(true)}>Batalkan Status</Button>
              )}
            </>
          )}
          {rent.status === 'returned' && (
            <>
              <Button color="danger" variant="flat" onPress={() => setIsRollbackOpen(true)}>Batalkan Status (Rollback)</Button>
            </>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
