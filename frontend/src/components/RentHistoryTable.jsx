import { Table, Chip, Button, Tooltip } from '@heroui/react';
import { CheckCircle, Package, XCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusProps = {
  draft: { className: 'bg-default-200 text-default-700 font-medium border-none' },
  booked: { className: 'bg-primary text-white font-medium border-none' },
  rented: { className: 'bg-warning text-white font-medium border-none' },
  returned: { className: 'bg-success text-white font-medium border-none' },
  overdue: { className: 'bg-danger text-white font-medium border-none' },
  cancelled: { className: 'bg-default-300 text-default-800 font-medium border-none' },
};

const statusLabels = {
  draft: 'Draft',
  booked: 'Dipesan',
  rented: 'Disewa',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

const statusA11yLabels = {
  draft: 'status draft',
  booked: 'status booked',
  rented: 'status rented',
  returned: 'status returned',
  overdue: 'status overdue',
  cancelled: 'status cancelled',
};

const RentHistoryTable = ({ rents, openReturnModal, openRentModal, openCancelModal }) => {
  const navigate = useNavigate();

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date);
  };

  const renderActions = (rent) => {
    switch (rent.status) {
      case 'booked':
        return (
          <>
            <Button
              variant="primary"
              size="sm"
              onPress={() => openRentModal(rent.id)}
              aria-label="Sewakan peminjaman"
            >
              <Package size={14} aria-hidden="true" />
              Disewakan
            </Button>
            <Button
              variant="danger"
              size="sm"
              onPress={() => openCancelModal(rent.id)}
              aria-label="Batalkan peminjaman"
            >
              <XCircle size={14} aria-hidden="true" />
              Batalkan
            </Button>
          </>
        );
      case 'rented':
      case 'overdue':
        return (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => openReturnModal(rent.id)}
            aria-label="Kembalikan peminjaman"
          >
            <CheckCircle size={14} aria-hidden="true" />
            Kembalikan
          </Button>
        );
      default:
        return null;
    }
  };

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
              <Chip size="sm" {...statusProps[rent.status]}>
                {statusLabels[rent.status] || rent.status}
              </Chip>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">Kostum</dt>
                <dd className="font-medium"><b>{rent.items?.length || 0}</b> item</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">Tanggal</dt>
                <dd className="text-right font-medium">{formatShortDate(rent.pickup_date)} - {formatShortDate(rent.expected_return_date)}</dd>
              </div>
            </dl>
            <span className="sr-only">{statusA11yLabels[rent.status] || `status ${rent.status}`}</span>
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <Tooltip content="Detail Peminjaman">
                <Button
                  onPress={() => navigate(`/rents/${rent.id}`)}
                  variant="flat"
                  size="sm"
                  isIconOnly
                  aria-label={`Detail peminjaman #${rent.id}`}
                >
                  <Eye size={16} aria-hidden="true" />
                </Button>
              </Tooltip>
              {renderActions(rent)}
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
                    <Table.Cell>{rent.id}</Table.Cell>
                    <Table.Cell>{rent.client_name}</Table.Cell>
                    <Table.Cell><b>{rent.items?.length || 0}</b> item</Table.Cell>
                    <Table.Cell>{formatShortDate(rent.pickup_date)} - {formatShortDate(rent.expected_return_date)}</Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" {...statusProps[rent.status]}>
                        {statusLabels[rent.status] || rent.status}
                      </Chip>
                      <span className="sr-only">{statusA11yLabels[rent.status] || `status ${rent.status}`}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-row gap-2 items-center">
                        <Tooltip content="Detail Peminjaman">
                          <Button
                            onPress={() => navigate(`/rents/${rent.id}`)}
                            variant="flat"
                            size="sm"
                            isIconOnly
                            aria-label={`Detail peminjaman #${rent.id}`}
                          >
                            <Eye size={16} />
                          </Button>
                        </Tooltip>
                        {renderActions(rent)}
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
