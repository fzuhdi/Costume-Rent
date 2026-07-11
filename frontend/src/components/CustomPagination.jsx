import { useState, useEffect } from 'react';
import { Pagination, ListBox, Select, Label } from '@heroui/react';

const LIMIT_OPTIONS = [5, 10, 25, 50];

const CustomPagination = ({ total, page, onPageChange, limit = 10, onLimitChange}) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
      <span className="text-sm text-[var(--muted)]">
        {total === 0 ? 'Tidak ada data' : `Menampilkan ${startItem}-${endItem} dari ${total} data`}
      </span>
      <div className="flex items-center gap-4 sm:ml-auto w-full sm:w-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-[var(--muted)] whitespace-nowrap">Per halaman</span>
          <Select
            className="w-[80px]"
            value={String(limit)}
            onChange={(value) => {
              onLimitChange?.(parseInt(value, 10));
            }}
          >
            <Label className="sr-only">Jumlah item per halaman</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {LIMIT_OPTIONS.map((opt) => (
                  <ListBox.Item key={String(opt)} id={String(opt)} textValue={`${opt} per halaman`}>
                    {opt}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <div className="overflow-x-auto flex-1 sm:flex-initial">
          <Pagination size="sm">
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous isDisabled={page === 1} onPress={() => onPageChange(page - 1)} aria-label="Halaman sebelumnya">
                  <Pagination.PreviousIcon />
                </Pagination.Previous>
              </Pagination.Item>
              {getPageNumbers().map((p, i) =>
                p === 'ellipsis' ? (
                  <Pagination.Item key={`ellipsis-${i}`}>
                    <Pagination.Ellipsis />
                  </Pagination.Item>
                ) : (
                  <Pagination.Item key={p}>
                    <Pagination.Link isActive={p === page} onPress={() => onPageChange(p)} aria-label={`Halaman ${p}`}>
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ),
              )}
              <Pagination.Item>
                <Pagination.Next isDisabled={page === totalPages} onPress={() => onPageChange(page + 1)} aria-label="Halaman berikutnya">
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default CustomPagination;
