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

  useEffect(() => {
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
    fetchData();
  }, []);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <Card className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] min-h-[600px] overflow-hidden">
      <Card.Header className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-[var(--border)]">
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
      </Card.Header>

      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface)] relative">
        <CalendarGrid
          loading={loading}
          rents={rents}
          currentDate={currentDate}
          search={search}
          navigate={navigate}
        />
      </div>
    </Card>
  );
};

export default CalendarPage;
