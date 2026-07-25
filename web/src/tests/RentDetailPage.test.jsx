import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from '@/lib/router-shim';
import RentDetailPage from '@/pages/RentDetailPage';
import * as rentApi from '@/api/rentApi';

vi.mock('../api/rentApi', () => ({
  getRentById: vi.fn(),
  addPayment: vi.fn(),
  updateRent: vi.fn(),
  markReturned: vi.fn(),
  markRented: vi.fn(),
  markBooked: vi.fn(),
  cancelRent: vi.fn(),
  deleteRent: vi.fn(),
  uploadPaymentProof: vi.fn(),
  extendRent: vi.fn(),

  rollbackOrder: vi.fn(),
}));

// Mock ResizeObserver for HeroUI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('RentDetailPage - Add Payment', () => {
  const mockRent = {
    id: 1,
    status: 'booked',
    client: { name: 'Test Client', phone: '123' },
    items: [{ id: 1, quantity: 1, rental_fee: 50000, costume: { name: 'Costume A' } }],
    total_paid: 25000,
    transactions: [
      { id: 1, amount: 25000, payment_method: 'CASH', created_at: '2026-07-15T10:00:00Z', notes: 'DP' }
    ],
    pickup_date: '2026-07-20',
    return_date: '2026-07-22'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rentApi.getRentById.mockResolvedValue({ data: mockRent });
    rentApi.addPayment.mockResolvedValue({ data: {} });
  });

  it('opens add payment modal and submits correct payload', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/rents/1']}>
        <Routes>
          <Route path="/admin/rents/:id" element={<RentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for rent data to load and button to appear
    const addButton = await screen.findByRole('button', { name: /\+ Tambah Pembayaran/i });
    expect(addButton).toBeInTheDocument();

    // Open modal
    await user.click(addButton);

    // Verify modal is open
    expect(screen.getByRole('heading', { name: /Tambah Pembayaran/i })).toBeInTheDocument();

    // Fill the form
    const amountInput = screen.getByPlaceholderText('0');
    await user.type(amountInput, '10000');

    const notesInput = screen.getByPlaceholderText('Contoh: Pelunasan Denda Keterlambatan');
    await user.type(notesInput, 'Late Fee');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Simpan Pembayaran/i });
    await user.click(submitBtn);

    // Verify API call
    await waitFor(() => {
      expect(rentApi.addPayment).toHaveBeenCalledWith('1', {
        amount: 10000,
        payment_method: 'CASH',
        payment_proof: '',
        notes: 'Late Fee'
      });
    });
  });
});

describe('RentDetailPage - Upgrade to Booked', () => {
  const mockRentDraft = {
    id: 2,
    status: 'draft',
    client: { name: 'Test Client', phone: '123' },
    items: [{ id: 1, quantity: 1, rental_fee: 100000, costume: { name: 'Costume A' } }],
    total_paid: 0,
    transactions: [],
    pickup_date: '2026-07-20',
    return_date: '2026-07-22'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rentApi.getRentById.mockResolvedValue({ data: mockRentDraft });
    rentApi.markBooked.mockResolvedValue({ data: {} });
  });

  it('submits nested payment payload when upgrading to booked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/rents/2']}>
        <Routes>
          <Route path="/admin/rents/:id" element={<RentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Click "Ubah Status ke Booked" button
    const upgradeButton = await screen.findByRole('button', { name: /Ubah Status ke Booked/i });
    await user.click(upgradeButton);

    // Verify modal is open
    expect(screen.getByRole('heading', { name: /Ubah Status ke Booked/i })).toBeInTheDocument();

    // The default amount is calculated as 50% of total base fee = 50000
    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Booked/i });
    await user.click(submitBtn);

    // Verify API call with nested payment
    await waitFor(() => {
      expect(rentApi.markBooked).toHaveBeenCalledWith('2', {
        payment: {
          amount: 50000,
          payment_method: 'CASH',
          payment_proof: '',
          notes: 'Downpayment Booked'
        }
      });
    });
  });
});
