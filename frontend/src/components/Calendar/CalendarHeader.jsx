import { Button } from '@heroui/react';
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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" size={16} />
          <input
            type="text"
            placeholder="Cari klien atau kostum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-default-50 border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
          />
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between sm:justify-start gap-1 bg-default-50 border border-default-200 rounded-lg p-1">
          <Button type="button" isIconOnly variant="light" size="sm" onPress={prevMonth} className="h-8 w-8 cursor-pointer">
            <ChevronLeft size={16} />
          </Button>
          <span className="font-semibold text-xs min-w-[120px] text-center select-none">
            {monthNames[month]} {year}
          </span>
          <Button type="button" isIconOnly variant="light" size="sm" onPress={nextMonth} className="h-8 w-8 cursor-pointer">
            <ChevronRight size={16} />
          </Button>
          <div className="w-[1px] h-4 bg-default-200 mx-1" />
          <Button type="button" variant="light" size="sm" onPress={today} className="h-8 font-semibold text-xs px-2 cursor-pointer">
            Hari Ini
          </Button>
        </div>

        {/* New Booking Button */}
        <Button
          type="button"
          onPress={() => navigate('/pos')}
          className="bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-sm rounded-lg flex items-center gap-2 px-4 py-2 shadow-md shadow-primary/20 cursor-pointer"
        >
          <Plus size={16} />
          Sewa Baru
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
