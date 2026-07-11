import { useState, useEffect, useMemo } from 'react';
import { getRents } from '../api/rentApi';
import { Card, Spinner } from '@heroui/react';
import { Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getRents({ limit: 1000 });
      setRents(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data for dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const today = new Date();
    // Use local date for string
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - (offset*60*1000))
    const todayStr = localDate.toISOString().split('T')[0]

    const pickupsToday = rents.filter(r => r.pickup_date === todayStr && r.status === 'active');
    const returnsToday = rents.filter(r => r.expected_return_date === todayStr && r.status === 'active');
    
    // Overdue: status is active and expected_return_date < todayStr
    const overdueReturns = rents.filter(r => r.status === 'active' && r.expected_return_date < todayStr);

    const financialsToday = rents.filter(r => r.created_at?.startsWith(todayStr)).reduce((sum, r) => sum + (r.downpayment || 0), 0) +
                            rents.filter(r => r.actual_return_date?.startsWith(todayStr)).reduce((sum, r) => sum + (r.damage_fee || 0), 0) +
                            pickupsToday.reduce((sum, r) => sum + (r.items.reduce((s, i) => s + (i.rental_fee * i.quantity), 0) - (r.downpayment || 0)), 0);

    const damageFeesToday = rents.filter(r => r.actual_return_date?.startsWith(todayStr)).reduce((sum, r) => sum + (r.damage_fee || 0), 0);

    // Top Rented Costumes (all time for now)
    const costumeCounts = {};
    rents.forEach(r => {
      r.items.forEach(item => {
        if (!costumeCounts[item.costume_id]) {
          costumeCounts[item.costume_id] = { name: item.costume_name, count: 0 };
        }
        costumeCounts[item.costume_id].count += item.quantity;
      });
    });
    const topCostumes = Object.values(costumeCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    return { pickupsToday, returnsToday, overdueReturns, financialsToday, damageFeesToday, topCostumes, todayStr };
  }, [rents]);

  if (loading) return <div className="flex justify-center items-center h-48"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ringkasan Operasional</h1>
          <p className="text-default-500">Tanggal: {stats.todayStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-200 shadow-sm">
          <Card.Content className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg text-primary">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-default-600 text-sm font-semibold">Diambil Hari Ini</p>
              <p className="text-2xl font-bold text-primary">{stats.pickupsToday.length} Pesanan</p>
            </div>
          </Card.Content>
        </Card>
        
        <Card className="bg-success-50 border border-success-200 shadow-sm">
          <Card.Content className="p-4 flex items-center gap-4">
            <div className="p-3 bg-success-100 rounded-lg text-success">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-default-600 text-sm font-semibold">Kembali Hari Ini</p>
              <p className="text-2xl font-bold text-success">{stats.returnsToday.length} Pesanan</p>
            </div>
          </Card.Content>
        </Card>

        <Card className="bg-danger-50 border border-danger-200 shadow-sm">
          <Card.Content className="p-4 flex items-center gap-4">
            <div className="p-3 bg-danger-100 rounded-lg text-danger">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-default-600 text-sm font-semibold">Terlambat Kembali</p>
              <p className="text-2xl font-bold text-danger">{stats.overdueReturns.length} Pesanan</p>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border border-default-200">
          <Card.Content className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="text-success" />
              <h3 className="text-lg font-bold">Keuangan Hari Ini</h3>
            </div>
            <div className="flex justify-between items-center bg-default-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-default-500">Estimasi Pemasukan (DP + Pelunasan)</p>
                <p className="text-xl font-bold text-success">Rp {stats.financialsToday.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-default-50 p-4 rounded-lg border-l-4 border-warning">
              <div>
                <p className="text-sm text-default-500">Denda Kerusakan Masuk</p>
                <p className="text-lg font-bold text-warning">Rp {stats.damageFeesToday.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="shadow-sm border border-default-200">
          <Card.Content className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary" />
              <h3 className="text-lg font-bold">Kostum Terpopuler</h3>
            </div>
            <div className="flex flex-col gap-2">
              {stats.topCostumes.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2 hover:bg-default-50 rounded">
                  <span className="text-sm font-medium">{i + 1}. {c.name}</span>
                  <span className="text-sm text-default-500">{c.count} disewa</span>
                </div>
              ))}
              {stats.topCostumes.length === 0 && <p className="text-sm text-default-400">Belum ada data penyewaan.</p>}
            </div>
          </Card.Content>
        </Card>
      </div>

      {stats.overdueReturns.length > 0 && (
        <Card className="border-danger-200 shadow-sm mt-4">
          <Card.Header className="bg-danger-50 px-5 py-3">
            <h3 className="text-danger font-bold">Pesanan Terlambat</h3>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="flex flex-col">
              {stats.overdueReturns.map(r => (
                <Link key={r.id} to={`/rents/${r.id}`} className="flex justify-between p-4 border-b border-default-100 hover:bg-default-50 transition">
                  <div>
                    <p className="font-semibold">{r.client_name}</p>
                    <p className="text-xs text-default-500">Seharusnya kembali: {r.expected_return_date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-danger-100 text-danger px-2 py-1 rounded-full">Overdue</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

    </div>
  );
};

export default DashboardPage;
