import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from '@/components/ui/alert';

describe('marketplace announcement semantics', () => {
  it('keeps static notices out of assertive live regions', () => {
    render(<Alert>Stok belum ditahan</Alert>);

    expect(screen.getByText('Stok belum ditahan')).not.toHaveAttribute('role');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('allows call sites to request polite and assertive announcements', () => {
    const { rerender } = render(<Alert announcement="status">Ditambahkan</Alert>);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    rerender(<Alert announcement="alert">Pilih tanggal acara</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Pilih tanggal acara');
  });
});
