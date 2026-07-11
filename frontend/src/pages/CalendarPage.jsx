import { useState, useEffect } from 'react';
import { getRents } from '../api/rentApi';
import { Card, Spinner, Button, Popover, Chip, Avatar } from '@heroui/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Parse YYYY-MM-DD safely into local date
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateStr = (y, m, d) => {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRents({ limit: 1000 });
      setRents(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch calendar rents:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay(); // Day of week of 1st day (0 = Sunday, etc.)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayDate = new Date();

  // Create grid cells (previous month trailing, current month, next month leading)
  const grid = [];
  
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthVal = month === 0 ? 11 : month - 1;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonthVal + 1, 0).getDate();

  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthVal = month === 11 ? 0 : month + 1;

  // Trailing previous month days
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    grid.push({
      day: d,
      date: new Date(prevMonthYear, prevMonthVal, d),
      dateStr: formatDateStr(prevMonthYear, prevMonthVal, d),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({
      day: d,
      date: new Date(year, month, d),
      dateStr: formatDateStr(year, month, d),
      isCurrentMonth: true
    });
  }

  // Leading next month days
  let nextMonthDay = 1;
  while (grid.length % 7 !== 0) {
    grid.push({
      day: nextMonthDay,
      date: new Date(nextMonthYear, nextMonthVal, nextMonthDay),
      dateStr: formatDateStr(nextMonthYear, nextMonthVal, nextMonthDay),
      isCurrentMonth: false
    });
    nextMonthDay++;
  }

  // Chunk into weeks (rows)
  const weeks = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  // Redirect to POS with preselected date
  const handleCellClick = (dateStr) => {
    navigate(`/pos?date=${dateStr}`);
  };

  // Filter rents based on search query
  const filteredRents = rents.filter(r => {
    if (r.status === 'cancelled') return false; // exclude cancelled bookings to reduce noise
    
    if (!search) return true;
    const q = search.toLowerCase();
    const hasCostumeMatch = r.items?.some(item => 
      (item.costume_name || '').toLowerCase().includes(q)
    );
    return (
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      hasCostumeMatch
    );
  });

  // Segment a single rent order for a specific week row
  const getWeeklySegment = (rent, weekStart, weekEnd) => {
    const rentStart = parseLocalDate(rent.pickup_date);
    const rentEnd = parseLocalDate(rent.expected_return_date);

    if (!rentStart || !rentEnd) return null;
    if (rentEnd < weekStart || rentStart > weekEnd) return null;

    // Convert local date offset to week indices (0-6)
    const startIndex = rentStart <= weekStart ? 0 : rentStart.getDay();
    const endIndex = rentEnd >= weekEnd ? 6 : rentEnd.getDay();
    const span = endIndex - startIndex + 1;

    return { startIndex, endIndex, span, rent };
  };

  // Stacks segments inside a week to prevent overlapping
  const calculateWeeklyStack = (weekStart, weekEnd) => {
    const segments = filteredRents
      .map(rent => getWeeklySegment(rent, weekStart, weekEnd))
      .filter(Boolean);

    // Sort by startIndex, then span descending
    segments.sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      return b.span - a.span;
    });

    const rows = [];
    for (const seg of segments) {
      let placed = false;
      for (let i = 0; i < rows.length; i++) {
        const hasOverlap = rows[i].some(s => 
          (seg.startIndex <= s.endIndex) && (seg.endIndex >= s.startIndex)
        );
        if (!hasOverlap) {
          rows[i].push(seg);
          seg.rowIndex = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([seg]);
        seg.rowIndex = rows.length - 1;
      }
    }

    return {
      segments,
      maxRows: Math.max(1, rows.length)
    };
  };

  // Status visual themes
  const getStatusConfig = (status) => {
    switch (status) {
      case 'booked':
        return {
          badgeClass: 'bg-warning-100 text-warning-800 dark:bg-warning-950/40 dark:text-warning-300',
          gradientClass: 'from-amber-500 to-orange-600 text-white shadow-sm shadow-orange-500/20',
          label: 'Dipesan'
        };
      case 'rented':
        return {
          badgeClass: 'bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300',
          gradientClass: 'from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20',
          label: 'Disewa'
        };
      case 'overdue':
        return {
          badgeClass: 'bg-danger-100 text-danger-800 dark:bg-danger-950/40 dark:text-danger-300 animate-pulse',
          gradientClass: 'from-rose-500 to-red-600 text-white shadow-sm shadow-red-500/20 animate-pulse',
          label: 'Terlambat'
        };
      case 'returned':
        return {
          badgeClass: 'bg-success-100 text-success-800 dark:bg-success-950/40 dark:text-success-300',
          gradientClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 shadow-sm',
          label: 'Selesai'
        };
      default:
        return {
          badgeClass: 'bg-default-100 text-default-800 dark:bg-default-950/40 dark:text-default-300',
          gradientClass: 'bg-default-100 text-default-700 dark:bg-default-800 dark:text-default-300 border border-default-200 shadow-sm',
          label: status
        };
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] min-h-[600px] overflow-hidden">
      {/* Top Header & Filter Bar */}
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
            <Button isIconOnly variant="light" size="sm" onPress={prevMonth} className="h-8 w-8 cursor-pointer">
              <ChevronLeft size={16} />
            </Button>
            <span className="font-semibold text-xs min-w-[120px] text-center select-none">
              {monthNames[month]} {year}
            </span>
            <Button isIconOnly variant="light" size="sm" onPress={nextMonth} className="h-8 w-8 cursor-pointer">
              <ChevronRight size={16} />
            </Button>
            <div className="w-[1px] h-4 bg-default-200 mx-1" />
            <Button variant="light" size="sm" onPress={today} className="h-8 font-semibold text-xs px-2 cursor-pointer">
              Hari Ini
            </Button>
          </div>

          {/* New Booking Button */}
          <Button
            onPress={() => navigate('/pos')}
            className="bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-sm rounded-lg px-4 py-2 shadow-md shadow-primary/20 cursor-pointer"
            startContent={<Plus size={16} />}
          >
            Sewa Baru
          </Button>
        </div>
      </div>

      {/* Monthly Grid Calendar Card */}
      <Card className="flex-1 flex flex-col border border-[var(--border)] shadow-sm overflow-hidden bg-[var(--surface)]">
        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2">
            <Spinner size="lg" />
            <span className="text-sm text-default-500 font-medium">Memuat kalender...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Columns Header (Sunday - Saturday) */}
            <div className="grid grid-cols-7 border-b border-[var(--border)] bg-default-50/50 backdrop-blur-sm shrink-0">
              {dayNames.map(day => (
                <div key={day} className="py-2.5 text-center text-xs font-bold text-default-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks Container */}
            <div className="flex-1 divide-y divide-[var(--border)] flex flex-col min-h-[500px]">
              {weeks.map((week, weekIdx) => {
                const weekStart = week[0].date;
                const weekEnd = week[6].date;
                const { segments, maxRows } = calculateWeeklyStack(weekStart, weekEnd);

                // Dynamically calculate row height to contain all stacked elements (min-h 120px)
                const rowHeight = Math.max(120, 36 + maxRows * 26 + 10);

                return (
                  <div
                    key={weekIdx}
                    className="relative w-full flex-1 flex flex-col overflow-hidden items-stretch"
                    style={{ minHeight: 120, height: rowHeight }}
                  >
                    {/* Underlay Day Cells Grid */}
                    <div className="grid grid-cols-7 absolute inset-0">
                      {week.map((cell) => {
                        const isToday = todayDate.getDate() === cell.day &&
                                        todayDate.getMonth() === cell.date.getMonth() &&
                                        todayDate.getFullYear() === cell.date.getFullYear();
                        return (
                          <div
                            key={cell.dateStr}
                            onClick={() => handleCellClick(cell.dateStr)}
                            className={`border-r border-[var(--border)]/70 last:border-0 p-2 cursor-pointer hover:bg-primary-50/5 active:bg-primary-50/10 transition-colors flex flex-col items-end group relative ${
                              cell.isCurrentMonth ? 'bg-white' : 'bg-default-50/40'
                            }`}
                          >
                            <span className={`text-[11px] font-extrabold w-6 h-6 flex items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                              isToday 
                                ? 'bg-primary text-white font-bold shadow-sm' 
                                : cell.isCurrentMonth ? 'text-default-700' : 'text-default-300'
                            }`}>
                              {cell.day}
                            </span>
                            
                            {/* Subtle add button shown on cell hover */}
                            <div className="absolute left-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-50 rounded-full p-1 border border-primary-100">
                              <Plus size={10} className="text-primary font-bold" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Overlay Timeline Bars */}
                    <div className="absolute inset-0 pointer-events-none p-1">
                      {segments.map((seg) => {
                        const { startIndex, span, rent, rowIndex } = seg;
                        const statusConfig = getStatusConfig(rent.status);

                        const left = `calc(${(startIndex / 7) * 100}% + 4px)`;
                        const width = `calc(${(span / 7) * 100}% - 8px)`;
                        const top = `${32 + rowIndex * 26}px`;

                        return (
                          <Popover key={rent.id} placement="bottom" showArrow>
                            <Popover.Trigger>
                              <button
                                style={{
                                  left,
                                  width,
                                  top,
                                  height: '21px',
                                }}
                                className={`absolute rounded px-2 text-left font-bold text-[10px] tracking-wide truncate transition-transform hover:scale-[1.01] active:scale-[0.99] select-none cursor-pointer flex items-center pointer-events-auto shadow-sm bg-gradient-to-r ${statusConfig.gradientClass}`}
                              >
                                {rent.client_name}
                              </button>
                            </Popover.Trigger>

                            <Popover.Content className="p-0 border border-[var(--border)] shadow-xl overflow-hidden rounded-xl bg-[var(--surface)] text-[var(--foreground)] w-72 pointer-events-auto">
                              <div className="p-4 flex flex-col gap-3">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar name={rent.client_name} size="sm" className="bg-primary/10 text-primary text-xs font-bold" />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-extrabold">{rent.client_name}</span>
                                      <span className="text-[10px] text-default-400">Order #{rent.id}</span>
                                    </div>
                                  </div>
                                  <Chip size="sm" className={`font-semibold ${statusConfig.badgeClass}`}>
                                    {statusConfig.label}
                                  </Chip>
                                </div>

                                {/* Content Details */}
                                <div className="flex flex-col gap-2 text-xs">
                                  {rent.client_phone && (
                                    <div className="flex items-center gap-2 text-default-600">
                                      <Phone size={12} className="text-default-400" />
                                      <span>{rent.client_phone}</span>
                                    </div>
                                  )}
                                  {rent.client_address && (
                                    <div className="flex items-start gap-2 text-default-600">
                                      <MapPin size={12} className="text-default-400 mt-0.5 shrink-0" />
                                      <span className="line-clamp-2">{rent.client_address}</span>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2 text-default-600 border-t border-dashed border-default-200 pt-2 mt-1">
                                    <Clock size={12} className="text-default-400 mt-0.5 shrink-0" />
                                    <div className="flex flex-col text-[11px] gap-0.5">
                                      <div>Ambil: <span className="font-bold text-default-800">{rent.pickup_date}</span></div>
                                      <div>Acara: <span className="font-bold text-default-800">{rent.event_date}</span></div>
                                      <div>Kembali: <span className="font-bold text-default-800">{rent.expected_return_date}</span></div>
                                    </div>
                                  </div>
                                </div>

                                {/* Costume Items */}
                                <div className="bg-default-50 rounded-lg p-2 flex flex-col gap-1 border border-default-100">
                                  <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider px-1">Item Kostum</span>
                                  <ul className="flex flex-col gap-1 max-h-24 overflow-y-auto px-1">
                                    {rent.items?.map(item => (
                                      <li key={item.id} className="text-[11px] flex justify-between gap-2 border-b border-default-100/50 last:border-0 pb-1 last:pb-0">
                                        <span className="font-medium text-default-800 truncate">{item.costume_name || item.costume?.name || `Kostum #${item.costume_id}`}</span>
                                        <span className="text-default-400 font-semibold shrink-0">x{item.quantity}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Actions */}
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="flat"
                                  onPress={() => navigate(`/rents/${rent.id}`)}
                                  className="w-full font-bold text-xs h-8 cursor-pointer mt-1"
                                >
                                  Lihat Detail Order
                                </Button>
                              </div>
                            </Popover.Content>
                          </Popover>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CalendarPage;
