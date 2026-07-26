import { Card, Table, Input, TextField } from '@heroui/react';
import { Link } from '@/lib/router-shim';

export default function RentDetailItems({
  rent,
  isEditing,
  editItems,
  setEditItems,
  formatCurrency
}) {
  return (
    <Card>
      <Card.Content>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Daftar Item</h2>
        </div>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Daftar Item">
              <Table.Header>
                <Table.Column isRowHeader>Item</Table.Column>
                <Table.Column>Harga</Table.Column>
              </Table.Header>
              <Table.Body>
                {rent.items?.map((item) => {
                  const editItem = editItems.find(i => i.costume_id === item.costume_id);
                  return (
                    <Table.Row key={item.id}>
                      <Table.Cell className="font-medium text-xs">
                        {item.quantity}x{' '}
                        <Link to={`/admin/catalogue/${item.costume_id}`} className="text-primary hover:underline" aria-label={`Lihat detail ${item.costume?.name}`}>
                          {item.costume?.name}
                        </Link>
                      </Table.Cell>
                      <Table.Cell className="font-semibold">
                        {isEditing ? (
                          <TextField
                            aria-label={`Harga ${item.costume?.name}`}
                            value={String(editItem?.custom_rental_fee ?? item.rental_fee)}
                            onChange={val => {
                              if (val === '') {
                                setEditItems(prev => prev.map(i => i.costume_id === item.costume_id ? { ...i, custom_rental_fee: '' } : i));
                                return;
                              }
                              const parsed = parseInt(val);
                              if (isNaN(parsed) || parsed < 0) return;
                              setEditItems(prev => prev.map(i => i.costume_id === item.costume_id ? { ...i, custom_rental_fee: parsed } : i));
                            }}
                          >
                            <Input
                              type="number"
                              size="sm"
                            />
                          </TextField>
                        ) : (
                          formatCurrency(item.rental_fee * item.quantity)
                        )}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card.Content>
    </Card>
  );
}
