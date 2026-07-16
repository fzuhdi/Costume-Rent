import { Spinner, Popover, Chip, Avatar } from '@heroui/react';
import { Phone, MapPin, Clock, Plus } from 'lucide-react';

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

// Status visual themes
const getStatusConfig = (status) => {
  switch (status) {
    case 'booked':
      return {
        badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
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
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 animate-pulse',
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

const CalendarGrid = ({ loading, rents, currentDate, search, navigate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date();

  const grid = [];
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthVal = month === 0 ? 11 : month - 1;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonthVal + 1, 0).getDate();

  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthVal = month === 11 ? 0 : month + 1;

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    grid.push({
      day: d,
      date: new Date(prevMonthYear, prevMonthVal, d),
      dateStr: formatDateStr(prevMonthYear, prevMonthVal, d),
      isCurrentMonth: false
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({
      day: d,
      date: new Date(year, month, d),
      dateStr: formatDateStr(year, month, d),
      isCurrentMonth: true
    });
  }

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

  const weeks = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  const handleCellClick = (dateStr) => {
    navigate(`/pos?date=${dateStr}`);
  };

  const filteredRents = rents.filter(r => {
    if (r.status === 'cancelled') return false;
    
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

  const calculateWeeklyStack = (weekStart, weekEnd) => {
    const segments = filteredRents.flatMap(rent => {
      const seg = getWeeklySegment(rent, weekStart, weekEnd);
      return seg ? [seg] : [];
    });

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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-2">
        <Spinner size="lg" />
        <span className="text-sm text-default-500 font-medium">Memuat kalender...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="min-w-[700px] flex-1 flex flex-col">
        {/* Columns Header (Sunday - Saturday) */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-default-50 backdrop-blur-sm shrink-0">
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
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCellClick(cell.dateStr);
                        }
                      }}
                      onClick={() => handleCellClick(cell.dateStr)}
                      className={`border-r border-[var(--border)]/70 last:border-0 p-2 cursor-pointer hover:bg-primary-50/5 active:bg-primary-50/10 transition-colors flex flex-col items-end group relative ${
                        cell.isCurrentMonth ? 'bg-white' : 'bg-default-50/40'
                      }`}
                    >
                      <span className={`text-[11px] font-extrabold w-6 h-6 flex items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                        isToday 
                          ? 'cal-today-badge' 
                          : cell.isCurrentMonth ? 'text-default-700' : 'text-default-300'
                      }`}>
                        {cell.day}
                      </span>
                      
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
                          type="button"
                          style={{ left, width, top, height: '21px' }}
                          className={`absolute rounded px-2 text-left font-bold text-[10px] tracking-wide truncate transition-transform hover:scale-[1.01] active:scale-[0.99] select-none cursor-pointer flex items-center pointer-events-auto shadow-sm bg-gradient-to-r ${statusConfig.gradientClass}`}
                        >
                          {rent.client_name}
                        </button>
                      </Popover.Trigger>

                      <Popover.Content className="p-0 border border-[var(--border)] shadow-xl overflow-hidden rounded-xl bg-[var(--surface)] text-[var(--foreground)] w-72 pointer-events-auto">
                        <div className="p-4 flex flex-col gap-3">
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

                          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                            <span className="text-[10px] font-bold text-default-500 uppercase tracking-wider">Kostum</span>
                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                              {rent.items?.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-xs p-1.5 rounded bg-default-50 border border-default-100">
                                  <span className="font-medium truncate pr-2">{item.costume_name}</span>
                                  <span className="font-bold bg-white px-1.5 rounded shadow-sm">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
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
    </div>
  );
};

export default CalendarGrid;
