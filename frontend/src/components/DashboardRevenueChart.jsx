import { useEffect, useState, useMemo } from 'react';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const DashboardRevenueChart = ({ data, filter = 'daily' }) => {
  const [Recharts, setRecharts] = useState(null);

  useEffect(() => {
    import('recharts').then(setRecharts);
  }, []);

  const processedData = useMemo(() => {
    if (!data) return [];
    
    let lastMonth = null;
    let lastYear = null;

    const getWeekNumber = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    };

    return data.map((item, index) => {
      let primaryLabel = item.date;
      let secondaryLabel = "";

      if (filter === 'daily' || filter === 'weekly') {
        const dateObj = new Date(item.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('id-ID', { month: 'short' });
        const year = dateObj.getFullYear();
        
        if (filter === 'daily') {
          primaryLabel = day.toString();
        } else {
          primaryLabel = 'W' + getWeekNumber(dateObj);
        }

        if (index === 0 || month !== lastMonth) {
          secondaryLabel = month;
          if (index === 0 || year !== lastYear) {
            secondaryLabel = `${month} '${String(year).slice(2)}`;
          }
        }
        
        lastMonth = month;
        lastYear = year;
      } else if (filter === 'monthly') {
        const parts = item.date.split(' ');
        if (parts.length === 2) {
          const [m, y] = parts;
          // Parse month manually or use Date object. Date parsing 'Jan 2026' works.
          const dateObj = new Date(item.date);
          const monthNum = isNaN(dateObj.getMonth()) ? m : (dateObj.getMonth() + 1).toString();
          
          primaryLabel = monthNum;
          
          if (index === 0 || y !== lastYear) {
            secondaryLabel = y;
          }
          lastYear = y;
        }
      } else if (filter === 'yearly') {
        primaryLabel = item.date;
      }

      return { ...item, primaryLabel, secondaryLabel, fullDate: item.date };
    });
  }, [data, filter]);

  if (!Recharts) return null;

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis 
          xAxisId={0}
          dataKey="primaryLabel" 
          tick={{fontSize: 10}} 
          tickMargin={10} 
          axisLine={false} 
          tickLine={false} 
          minTickGap={10}
        />
        <XAxis 
          xAxisId={1}
          dataKey="secondaryLabel" 
          tick={{fontSize: 11, fontWeight: 'bold'}} 
          axisLine={false} 
          tickLine={false} 
          interval={0}
        />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip 
          formatter={(value) => idrFormatter.format(value)} 
          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
          labelStyle={{color: 'black'}} 
        />
        <Line type="monotone" dataKey="amount" stroke="#17c964" strokeWidth={3} dot={false} activeDot={{r: 6}} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DashboardRevenueChart;
