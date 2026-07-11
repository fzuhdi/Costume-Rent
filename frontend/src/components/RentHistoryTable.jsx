import { Table, Chip, Button } from '@heroui/react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  active: { variant: 'secondary' },
  returned: { variant: 'soft', color: 'success' },
  overdue: { variant: 'soft', color: 'danger' },
};

const statusLabels = {
  active: 'Aktif',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
};

const statusA11yLabels = {
  active: 'status active',
  returned: 'status returned',
  overdue: 'status overdue',
};

const RentHistoryTable = ({ rents, openReturnModal }) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {rents.map((rent) => (
          <article
            key={rent.id}
            data-testid={`rent-card-${rent.id}`}
            className="rent-card rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {rent.client_name}
                </p>
                <p className="text-xs text-[var(--muted)]">Peminjaman #{rent.id}</p>
              </div>
              <Chip size="sm" {...statusColors[rent.status]}>
                {statusLabels[rent.status] || rent.status}
              </Chip>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">Kostum</dt>
                <dd className="font-medium">{rent.items?.length || 0} kostum</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">Tanggal</dt>
                <dd className="text-right font-medium">{rent.pickup_date} - {rent.expected_return_date}</dd>
              </div>
            </dl>
            <span className="sr-only">{statusA11yLabels[rent.status] || `status ${rent.status}`}</span>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                onPress={() => navigate(`/rents/${rent.id}`)}
                variant="bordered"
                size="sm"
                aria-label={`Detail peminjaman #${rent.id}`}
              >
                Detail
              </Button>
              {rent.status !== 'returned' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => openReturnModal(rent.id)}
                  aria-label="Kembalikan peminjaman"
                >
                  <CheckCircle size={14} aria-hidden="true" />
                  Kembalikan
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Rent history">
              <Table.Header>
                <Table.Column isRowHeader>ID</Table.Column>
                <Table.Column>Klien</Table.Column>
                <Table.Column>Kostum</Table.Column>
                <Table.Column>Tanggal</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Aksi</Table.Column>
              </Table.Header>
              <Table.Body>
                {rents.map((rent) => (
                  <Table.Row key={rent.id} aria-label={`Peminjaman #${rent.id} oleh ${rent.client_name}`}>
                    <Table.Cell>#{rent.id}</Table.Cell>
                    <Table.Cell>{rent.client_name}</Table.Cell>
                    <Table.Cell>{rent.items?.length || 0} kostum</Table.Cell>
                    <Table.Cell>{rent.pickup_date} - {rent.expected_return_date}</Table.Cell>
                    <Table.Cell>
                       <Chip size="sm" {...statusColors[rent.status]}>
                        {statusLabels[rent.status] || rent.status}
                      </Chip>
                      <span className="sr-only">{statusA11yLabels[rent.status] || `status ${rent.status}`}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <Button onPress={() => navigate(`/rents/${rent.id}`)} variant="bordered" size="sm" aria-label={`Detail peminjaman #${rent.id}`}>Detail</Button>
                          {rent.status !== 'returned' && (
                            <Button variant="secondary" size="sm" onPress={() => openReturnModal(rent.id)} aria-label="Kembalikan peminjaman"><CheckCircle size={14} aria-hidden="true" />Kembalikan</Button>
                          )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </>
  );
};

export default RentHistoryTable;
