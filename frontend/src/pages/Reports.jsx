/**
 * pages/Reports.jsx
 * KrushiMitra AI — Reports & Analytics
 * Features: Daily/Weekly/Monthly/Yearly Sales, Profit, GST, Inventory, Charts, Export
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, IndianRupee,
  Download, RefreshCw, Calendar, Package, Receipt,
  Users, Truck, FileSpreadsheet, FileText
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const PERIODS = ['Today', 'This Week', 'This Month', 'This Year', 'Custom'];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      callbacks: { label: (ctx) => ` ₹${ctx.parsed.y?.toLocaleString('en-IN') || ctx.parsed}` },
    },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', callback: v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` } },
  },
};

const Reports = () => {
  const [period, setPeriod] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [salesChart, setSalesChart] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [gstReport, setGstReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchReports(); }, [period]);

  const periodToParams = () => {
    const now = new Date();
    let startDate, endDate = now.toISOString();
    if (period === 'Today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === 'This Week') {
      const d = new Date(now); d.setDate(now.getDate() - now.getDay());
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    } else if (period === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (period === 'This Year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    }
    return { startDate, endDate };
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = periodToParams();
      const [summaryRes, salesRes, productRes] = await Promise.allSettled([
        api.get('/reports/summary', { params }),
        api.get('/reports/sales-chart', { params }),
        api.get('/reports/top-products', { params }),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data);
      if (productRes.status === 'fulfilled') setTopProducts(productRes.value.data.data || []);
      if (salesRes.status === 'fulfilled') {
        const d = salesRes.value.data.data || [];
        setSalesChart({
          labels: d.map(r => r.label || r._id),
          datasets: [{
            label: 'Sales (₹)',
            data: d.map(r => r.total || 0),
            backgroundColor: 'rgba(34,197,94,0.15)',
            borderColor: '#22c55e',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#22c55e',
            pointRadius: 4,
          }],
        });
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = periodToParams();
      const { data } = await api.get('/reports/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `KrushiMitra_Report_${period.replace(' ', '_')}.csv`;
      link.click();
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Export failed — please try again');
    }
  };

  const StatCard = ({ label, value, icon: Icon, color, sub, trend }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-5 border border-border-color">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </motion.div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Reports & Analytics</h1>
            <p className="text-sm text-text-secondary">Business performance insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchReports} className="p-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-color text-text-secondary hover:bg-bg-secondary transition-colors text-sm">
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {PERIODS.filter(p => p !== 'Custom').map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              period === p
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-text-secondary border border-border-color hover:bg-bg-secondary'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-border-color animate-pulse">
              <div className="h-10 w-10 bg-bg-secondary rounded-xl mb-3" />
              <div className="h-7 bg-bg-secondary rounded w-20 mb-2" />
              <div className="h-4 bg-bg-secondary rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Revenue" value={`₹${(summary?.totalRevenue || 0).toLocaleString('en-IN')}`}
              icon={IndianRupee} color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
            <StatCard label="Total Bills" value={summary?.totalBills || 0}
              icon={Receipt} color="bg-blue-500/10 text-blue-400 border border-blue-500/20"
              sub={`Avg ₹${(summary?.avgBillValue || 0).toLocaleString('en-IN')}`} />
            <StatCard label="GST Collected" value={`₹${(summary?.totalGST || 0).toLocaleString('en-IN')}`}
              icon={FileText} color="bg-purple-500/10 text-purple-400 border border-purple-500/20" />
            <StatCard label="Total Discount" value={`₹${(summary?.totalDiscount || 0).toLocaleString('en-IN')}`}
              icon={TrendingDown} color="bg-amber-500/10 text-amber-400 border border-amber-500/20" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Sales Trend */}
            <div className="lg:col-span-2 glass-panel rounded-2xl border border-border-color p-5">
              <h3 className="font-semibold text-text-primary mb-4">Sales Trend — {period}</h3>
              <div className="h-64">
                {salesChart ? (
                  <Line data={salesChart} options={{ ...chartDefaults }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-text-secondary text-sm">No data available</div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="glass-panel rounded-2xl border border-border-color p-5">
              <h3 className="font-semibold text-text-primary mb-4">Top 5 Products</h3>
              {topProducts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-text-secondary text-sm">No sales data</div>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-text-secondary w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{p.name || p._id}</p>
                        <div className="h-1.5 bg-bg-secondary rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (p.qty / (topProducts[0]?.qty || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-text-primary">₹{(p.revenue || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-text-secondary">{p.qty} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GST Summary */}
          <div className="glass-panel rounded-2xl border border-border-color p-5">
            <h3 className="font-semibold text-text-primary mb-4">GST Summary — {period}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Taxable Amount', value: summary?.taxableAmount, color: 'text-text-primary' },
                { label: 'CGST', value: summary?.cgst, color: 'text-blue-400' },
                { label: 'SGST', value: summary?.sgst, color: 'text-purple-400' },
                { label: 'Total GST', value: summary?.totalGST, color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-bg-secondary rounded-xl p-4">
                  <p className="text-xs text-text-secondary mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>₹{(value || 0).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
