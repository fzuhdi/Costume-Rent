import { Button, ButtonGroup, Input } from '@heroui/react';
import { Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const CalendarHeader = ({
  search,
  setSearch,
  month,
  year,
  prevMonth,
  nextMonth,
  today,
  navigate
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-primary" size={24} />
          <h1 className="text-xl font-bold tracking-tight">Kalender Acara</h1>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 select-none">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-default-500">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 shadow-sm shadow-orange-500/20" />
            <span>Dipesan (Booked)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-default-500">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/20" />
            <span>Disewa (Rented)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-default-500">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 shadow-sm shadow-red-500/20" />
            <span>Terlambat (Overdue)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-default-500">
            <span className="w-2.5 h-2.5 rounded border border-emerald-200/60 bg-emerald-50 dark:bg-emerald-950/40" />
            <span>Selesai (Returned)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-64">
          <Input
            placeholder="Cari klien atau kostum..."
            value={search}
            onValueChange={setSearch}
            startContent={<Search className="text-default-400" size={16} />}
            classNames={{
              inputWrapper: "bg-default-50 border-default-200 hover:border-default-300 focus-within:!border-primary",
              input: "text-sm"
            }}
            variant="bordered"
            aria-label="Cari klien atau kostum"
          />
        </div>

        {/* Date Navigator */}
        <ButtonGroup variant="flat" className="bg-default-50 border border-default-200">
          <Button isIconOnly size="sm" onPress={prevMonth} aria-label="Bulan Sebelumnya">
            <ChevronLeft size={16} />
          </Button>
          <Button size="sm" className="font-semibold text-xs min-w-[120px] pointer-events-none" disableAnimation>
            {monthNames[month]} {year}
          </Button>
          <Button isIconOnly size="sm" onPress={nextMonth} aria-label="Bulan Selanjutnya">
            <ChevronRight size={16} />
          </Button>
          <Button size="sm" onPress={today} className="font-semibold text-xs border-l border-default-200">
            Hari Ini
          </Button>
        </ButtonGroup>

        {/* New Booking Button */}
        <Button
          color="primary"
          onPress={() => navigate('/pos')}
          startContent={<Plus size={16} />}
          className="font-semibold px-6 shadow-md"
        >
          <Plus size={16} />
          Sewa Baru
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
