import { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/statsApi';
import { Card, Spinner, Button } from '@heroui/react';
import { AlertTriangle, TrendingUp, Package, Users, DollarSign, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div className="flex justify-center items-center h-48"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ringkasan Operasional</h1>
          <p className="text-default-500">Overview performa bisnis Anda.</p>
        </div>
      </div>

      {/* TOP ROW: High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Revenue Graph Card */}
        <Card className="col-span-1 md:col-span-2 shadow-sm border border-default-200">
          <Card.Content className="p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-success" />
              <h3 className="font-semibold text-sm text-default-700">Estimasi Pendapatan (7 Hari)</h3>
            </div>
            <div className="flex-1 min-h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.revenue_chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Tooltip formatter={(value) => idrFormatter.format(value)} labelStyle={{color: 'black'}} />
                  <Line type="monotone" dataKey="amount" stroke="#17c964" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Total Active Rents */}
        <Card className="shadow-sm border border-default-200 bg-primary-50/50">
          <Card.Content className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-2">
              <Package size={20} className="text-primary" />
              <h3 className="font-semibold text-sm text-default-600">Pesanan Aktif</h3>
            </div>
            <p className="text-3xl font-bold text-primary">{stats.total_active_rents}</p>
            <p className="text-xs text-default-500 mt-1">Status: Draft, Booked, Rented</p>
          </Card.Content>
        </Card>

        {/* Total Clients / Utilization */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-sm border border-default-200 flex-1">
            <Card.Content className="p-4 flex items-center justify-between">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <Users size={16} className="text-default-500" />
                   <h3 className="font-semibold text-xs text-default-500">Total Klien</h3>
                 </div>
                 <p className="text-xl font-bold">{stats.total_clients}</p>
               </div>
            </Card.Content>
          </Card>
          <Card className="shadow-sm border border-default-200 flex-1">
            <Card.Content className="p-4 flex items-center justify-between">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <TrendingUp size={16} className="text-default-500" />
                   <h3 className="font-semibold text-xs text-default-500">Utilisasi Stok</h3>
                 </div>
                 <p className="text-xl font-bold">{stats.stock_utilization.toFixed(1)}%</p>
               </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* MIDDLE ROW: Urgent Alerts */}
      {stats.overdue_returns.length > 0 && (
        <Card className="border-danger shadow-sm">
          <Card.Header className="bg-danger/10 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-danger" />
            <h3 className="text-danger font-bold text-sm">URGENT: Terlambat Kembali ({stats.overdue_returns.length})</h3>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="flex flex-col divide-y divide-default-100">
              {stats.overdue_returns.map(r => (
                <div key={r.id} className="flex justify-between items-center p-4 hover:bg-default-50 transition">
                  <div>
                    <p className="font-semibold text-sm">{r.client_name}</p>
                    <p className="text-xs text-default-500">Jadwal kembali: {r.expected_return_date}</p>
                  </div>
                  <Button size="sm" variant="flat" color="danger" onPress={() => navigate(`/rents/${r.id}`)}>
                    Selesaikan <ArrowRight size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* BOTTOM ROW: Operational Lists & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Upcoming Pickups / Returns */}
        <Card className="shadow-sm border border-default-200">
          <Card.Header className="px-4 py-3 border-b border-default-100 flex justify-between items-center">
            <h3 className="font-bold text-sm">📅 Jadwal 7 Hari Kedepan</h3>
            <Link to="/calendar" className="text-xs text-primary hover:underline">Lihat Kalender</Link>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="grid grid-cols-2 divide-x divide-default-100">
              <div className="p-4">
                <h4 className="text-xs font-semibold text-default-500 mb-3 uppercase tracking-wider">Pengambilan (Ambil)</h4>
                <div className="flex flex-col gap-3">
                  {stats.upcoming_pickups.length === 0 ? (
                    <p className="text-xs text-default-400">Tidak ada jadwal</p>
                  ) : (
                    stats.upcoming_pickups.map(r => (
                       <Link key={r.id} to={`/rents/${r.id}`} className="block hover:bg-default-50 -mx-2 p-2 rounded">
                          <p className="text-sm font-medium">{r.client_name}</p>
                          <p className="text-xs text-primary font-medium">{r.pickup_date}</p>
                       </Link>
                    ))
                  )}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-xs font-semibold text-default-500 mb-3 uppercase tracking-wider">Pengembalian (Kembali)</h4>
                <div className="flex flex-col gap-3">
                  {stats.upcoming_returns.length === 0 ? (
                    <p className="text-xs text-default-400">Tidak ada jadwal</p>
                  ) : (
                    stats.upcoming_returns.map(r => (
                       <Link key={r.id} to={`/rents/${r.id}`} className="block hover:bg-default-50 -mx-2 p-2 rounded">
                          <p className="text-sm font-medium">{r.client_name}</p>
                          <p className="text-xs text-success font-medium">{r.expected_return_date}</p>
                       </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Top Costumes */}
        <Card className="shadow-sm border border-default-200">
          <Card.Header className="px-4 py-3 border-b border-default-100">
            <h3 className="font-bold text-sm">⭐ Kostum Terpopuler</h3>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="flex flex-col divide-y divide-default-100">
              {stats.top_costumes.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-4 hover:bg-default-50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-default-300 w-6 text-center">{i + 1}</span>
                    <Link to={`/catalogue/${c.costume_id}`} className="text-sm font-medium hover:text-primary">{c.costume_name}</Link>
                  </div>
                  <span className="text-xs bg-default-100 text-default-600 px-2 py-1 rounded-full">{c.rent_count} disewa</span>
                </div>
              ))}
              {stats.top_costumes.length === 0 && <p className="p-4 text-sm text-default-400">Belum ada data penyewaan.</p>}
            </div>
          </Card.Content>
        </Card>
      </div>

    </div>
  );
};

export default DashboardPage;
