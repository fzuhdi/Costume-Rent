import { useState, useEffect } from 'react';
import { getRents } from '../api/rentApi';
import { Card, Spinner, Button } from '@heroui/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Calendar logic
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Helper to format date for comparison
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getRents({ limit: 1000 });
      setRents(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data for calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const todayDate = new Date();
  const isToday = (d) => todayDate.getDate() === d && todayDate.getMonth() === month && todayDate.getFullYear() === year;

  if (loading) return <div className="flex justify-center items-center h-48"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] min-h-[600px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-primary" size={24} />
          <h1 className="text-2xl font-bold">Kalender Acara</h1>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-default-200">
          <Button isIconOnly variant="light" size="sm" onPress={prevMonth}><ChevronLeft size={20} /></Button>
          <span className="font-semibold text-sm w-36 text-center">{monthNames[month]} {year}</span>
          <Button isIconOnly variant="light" size="sm" onPress={nextMonth}><ChevronRight size={20} /></Button>
          <Button variant="flat" size="sm" onPress={today} className="ml-2 font-medium">Hari Ini</Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col border border-default-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full h-full flex flex-col">
          <div className="min-w-[700px] grid grid-cols-7 border-b border-default-200 bg-default-50 shrink-0">
            {dayNames.map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-default-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          <div className="min-w-[700px] flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 auto-rows-fr h-full bg-default-100 gap-[1px]">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[120px]" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = formatDateStr(year, month, d);
              
              const dayRents = rents.filter(r => r.event_date === dateStr || r.pickup_date === dateStr || r.expected_return_date === dateStr);
              
              return (
                <div key={d} className={`bg-white min-h-[120px] p-2 hover:bg-default-50 transition-colors flex flex-col relative`}>
                  <div className={`text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday(d) ? 'bg-primary text-white' : 'text-default-700'}`}>
                    {d}
                  </div>
                  
                  <div className="flex flex-col gap-1 overflow-y-auto flex-1 no-scrollbar">
                    {dayRents.map(r => {
                      let type = 'Acara';
                      let color = 'bg-primary-100 text-primary-700 border-primary-200';
                      
                      if (r.pickup_date === dateStr) {
                        type = 'Ambil';
                        color = 'bg-warning-100 text-warning-700 border-warning-200';
                      }
                      if (r.expected_return_date === dateStr) {
                        type = 'Kembali';
                        color = 'bg-success-100 text-success-700 border-success-200';
                      }
                      
                      // Skip rendering if rent is returned and this is just an event marker to avoid clutter
                      if (r.status === 'returned' && type === 'Acara') return null;
                      
                      return (
                        <div 
                          key={`${r.id}-${type}`} 
                          onClick={() => navigate(`/rents/${r.id}`)}
                          className={`text-[10px] p-1 px-1.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${color}`}
                          title={`${type}: ${r.client_name}`}
                        >
                          <span className="font-bold">{type}:</span> {r.client_name}
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </Card>
    </div>
  );
};

export default CalendarPage;
