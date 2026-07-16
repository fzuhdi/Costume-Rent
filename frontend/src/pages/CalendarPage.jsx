import { useState, useEffect } from 'react';
import { getRents } from '../api/rentApi';
import { Card } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import CalendarGrid from '../components/Calendar/CalendarGrid';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchData();
  }, []);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] min-h-[600px] overflow-hidden">
      <CalendarHeader
        search={search}
        setSearch={setSearch}
        month={month}
        year={year}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        today={today}
        navigate={navigate}
      />

      {/* Monthly Grid Calendar Card */}
      <Card className="flex-1 flex flex-col border border-[var(--border)] shadow-sm overflow-hidden bg-[var(--surface)]">
        <CalendarGrid
          loading={loading}
          rents={rents}
          currentDate={currentDate}
          search={search}
          navigate={navigate}
        />
      </Card>
    </div>
  );
};

export default CalendarPage;
