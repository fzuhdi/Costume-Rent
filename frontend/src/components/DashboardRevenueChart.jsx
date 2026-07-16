import { useEffect, useState } from 'react';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const DashboardRevenueChart = ({ data }) => {
  const [Recharts, setRecharts] = useState(null);

  useEffect(() => {
    import('recharts').then(setRecharts);
  }, []);

  if (!Recharts) return null;

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tick={{fontSize: 10}} tickMargin={10} axisLine={false} tickLine={false} />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip formatter={(value) => idrFormatter.format(value)} labelStyle={{color: 'black'}} />
        <Line type="monotone" dataKey="amount" stroke="#17c964" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DashboardRevenueChart;
