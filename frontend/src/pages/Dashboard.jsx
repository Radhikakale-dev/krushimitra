/**
 * pages/Dashboard.jsx
 * KrushiMitra AI — Professional POS Dashboard
 * Design: D-Mart / Vyapar / Marg ERP inspired
 * Features: Live KPIs, 4 charts, low-stock alerts, recent bills
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Package,
  Users, Truck, AlertTriangle, XCircle, Clock, RefreshCw,
  BarChart3, ArrowUp, ArrowDown, Calendar, Boxes, Receipt,
  CheckCircle2, AlertCircle, Sprout, ChevronRight, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';

// Register Chart.js modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ── Chart theme defaults ────────────────────────────────────────────────────
const CHART_FONT = { family: 'Inter, system-ui, sans-serif', size: 11 };
const chartTooltip = {
  backgroundColor: '#0f172a',
  titleColor: '#f1f5f9',
  bodyColor: '#94a3b8',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  titleFont: { ...CHART_FONT, weight: 'bold' },
  bodyFont: CHART_FONT,
  callbacks: {
    label: (ctx) => ` ₹${Number(ctx.raw).toLocaleString('en-IN')}`,
  },
};
const chartGrid = { color: 'rgba(255,255,255,0.04)', drawBorder: false };
const chartTick = { color: '#475569', font: CHART_FONT };

// ── Demo data (shown when DB is empty) ────────────────────────────────────
const DEMO = {
  kpis: {
    todaySales: 47500, todayBills: 18, todayGst: 4250, todayDiscount: 1200,
    monthlySales: 382400, monthlyBills: 156,
    totalRevenue: 1284500, netProfit: 282590,
    totalProducts: 247, activeProducts: 231, inventoryValue: 1840000,
    totalCustomers: 89, totalSuppliers: 14,
    pendingPayments: 34000, monthlyExpenses: 84000,
    lowStockCount: 8, outOfStockCount: 3, expiredCount: 2,
  },
  charts: {
    salesTrend: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Today'],
      data:   [28000,42000,31000,56000,38000,67000,47500],
    },
    monthlyRevenue: {
      labels:  ['Feb','Mar','Apr','May','Jun','Jul'],
      revenue: [290000,340000,310000,420000,390000,382400],
      bills:   [118,138,126,170,158,156],
    },
    paymentBreakdown: {
      labels: ['Cash','UPI','Card','Credit'],
      data:   [22500,18700,6000,300],
    },
    inventory: {
      labels: ['In Stock','Low Stock','Out of Stock'],
      data:   [236,8,3],
    },
  },
  lowStockItems: [
    { _id:'1', name:'Urea Fertilizer 50kg',   sku:'FERT-001', stock:3,  minStock:10, unit:'bag' },
    { _id:'2', name:'NPK 19:19:19 1kg',       sku:'FERT-008', stock:2,  minStock:15, unit:'kg'  },
    { _id:'3', name:'Neem Oil Pest Control',  sku:'PEST-012', stock:4,  minStock:8,  unit:'liter'},
    { _id:'4', name:'Sprout Seeds Tomato',    sku:'SEED-043', stock:1,  minStock:5,  unit:'packet'},
  ],
  outOfStockItems: [
    { _id:'5', name:'Glyphosate Herbicide 1L',sku:'HERB-021', unit:'liter' },
    { _id:'6', name:'Agri Sprayer Pump 16L',  sku:'TOOL-005', unit:'piece' },
    { _id:'7', name:'Micronutrient Mix 1kg',  sku:'FERT-019', unit:'kg'   },
  ],
  topProducts: [
    { _id:'Urea Fertilizer 50kg', revenue:54000, qty:120 },
    { _id:'DAP Fertilizer 50kg',  revenue:133000,qty:95  },
    { _id:'Neem Oil Pest Control',revenue:18500, qty:74  },
    { _id:'NPK 19:19:19 1kg',     revenue:8100,  qty:45  },
  ],
  recentBills: [
    { _id:'b1', invoiceNo:'INV-2026-104', customerName:'Vikram Patil',    grandTotal:5800,  status:'Paid',    date: new Date().toISOString() },
    { _id:'b2', invoiceNo:'INV-2026-103', customerName:'Rahul Shinde',    grandTotal:2300,  status:'Paid',    date: new Date().toISOString() },
    { _id:'b3', invoiceNo:'INV-2026-102', customerName:'Kiran Deshmukh',  grandTotal:12000, status:'Partial', date: new Date(Date.now()-3600000).toISOString() },
    { _id:'b4', invoiceNo:'INV-2026-101', customerName:'Anil Shinde',     grandTotal:3500,  status:'Credit',  date: new Date(Date.now()-86400000).toISOString() },
    { _id:'b5', invoiceNo:'INV-2026-100', customerName:'Walk-in Customer',grandTotal:1200,  status:'Paid',    date: new Date(Date.now()-90000000).toISOString() },
  ],
};

// ── Animation variants ───────────────────────────────────────────────────────
const fadeUp = (delay=0) => ({
  initial: { opacity:0, y:16 },
  animate: { opacity:1, y:0 },
  transition: { duration:0.4, delay, ease:'easeOut' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, isAdmin, getToken } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [period, setPeriod]   = useState('week');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      // If all KPIs are zero (empty DB), use demo data
      const allZero = res.data?.kpis && Object.values(res.data.kpis).every(v => v === 0);
      setData(allZero ? DEMO : res.data);
    } catch (err) {
      // Fallback to demo data on error (e.g. first run)
      setData(DEMO);
      setError('Using demo data — connect to MongoDB to see live stats.');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const kpis = data?.kpis || DEMO.kpis;
  const charts = data?.charts || DEMO.charts;

  // ── Primary KPI cards ──────────────────────────────────────────────────────
  const primaryKpis = [
    {
      label: "Today's Sales",   value: kpis.todaySales,   format: 'currency',
      sub: `${kpis.todayBills} bills today`,
      icon: ShoppingCart, color: 'from-primary-500/20 to-emerald-500/10',
      border: 'border-primary-500/20', text: 'text-primary-400',
      glow: 'shadow-primary-500/10', trend: +12.4,
    },
    {
      label: 'Monthly Sales',   value: kpis.monthlySales, format: 'currency',
      sub: `${kpis.monthlyBills} bills this month`,
      icon: TrendingUp, color: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-500/20', text: 'text-blue-400',
      glow: 'shadow-blue-500/10', trend: +8.2,
    },
    {
      label: 'Total Revenue',   value: kpis.totalRevenue, format: 'currency',
      sub: 'This financial year',
      icon: IndianRupee, color: 'from-violet-500/20 to-purple-500/10',
      border: 'border-violet-500/20', text: 'text-violet-400',
      glow: 'shadow-violet-500/10', trend: +18.7,
    },
    {
      label: 'Net Profit',      value: kpis.netProfit,    format: 'currency',
      sub: `Expenses: ${formatCurrency(kpis.monthlyExpenses, true)}`,
      icon: BarChart3, color: 'from-emerald-500/20 to-green-500/10',
      border: 'border-emerald-500/20', text: 'text-emerald-400',
      glow: 'shadow-emerald-500/10', trend: +22.1,
    },
  ];

  // ── Secondary KPI cards ────────────────────────────────────────────────────
  const secondaryKpis = [
    {
      label: 'Total Products',  value: kpis.totalProducts,  format: 'number',
      sub: `Value: ${formatCurrency(kpis.inventoryValue, true)}`,
      icon: Package, color: 'from-orange-500/15 to-amber-500/5', text: 'text-orange-400', border: 'border-orange-500/20',
    },
    {
      label: 'Customers',       value: kpis.totalCustomers,  format: 'number',
      sub: `Pending: ${formatCurrency(kpis.pendingPayments, true)}`,
      icon: Users, color: 'from-cyan-500/15 to-sky-500/5', text: 'text-cyan-400', border: 'border-cyan-500/20',
    },
    {
      label: 'Suppliers',       value: kpis.totalSuppliers,  format: 'number',
      sub: 'Active partners',
      icon: Truck, color: 'from-indigo-500/15 to-blue-500/5', text: 'text-indigo-400', border: 'border-indigo-500/20',
    },
    {
      label: 'Pending Payments',value: kpis.pendingPayments, format: 'currency',
      sub: 'Customer credit dues',
      icon: Receipt, color: 'from-amber-500/15 to-yellow-500/5', text: 'text-amber-400', border: 'border-amber-500/20',
    },
  ];

  return (
    <div className="p-5 md:p-6 space-y-6 min-h-screen">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content flex items-center gap-2.5">
            <div className="h-8 w-8 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Sprout className="h-4 w-4 text-content" />
            </div>
            Dashboard
          </h1>
          <p className="text-sm text-content-muted mt-0.5">
            Welcome back, <span className="text-content font-medium">{user?.name?.split(' ')[0]}</span> ·{' '}
            <span className="text-slate-600">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Period selector */}
          <div className="flex items-center bg-surface border border-divider/60 rounded-xl p-1 text-xs">
            {[['today','Today'],['week','7 Days'],['month','Month']].map(([key,label])=>(
              <button key={key} onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${period===key ? 'bg-primary-500 text-white shadow-md' : 'text-content-muted hover:text-content'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={fetchStats} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-divider/60 text-xs text-content-muted hover:text-content hover:border-slate-600 transition-all disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* ── Error / Demo banner ───────────────────────────────────────────────── */}
      {error && (
        <motion.div {...fadeUp(0.05)} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* ── Primary KPI Cards ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {primaryKpis.map((kpi, i) => (
            <PrimaryKpiCard key={kpi.label} {...kpi} delay={0.05 * i} />
          ))}
        </div>
      )}

      {/* ── Secondary KPI Cards ───────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {secondaryKpis.map((kpi, i) => (
            <SecondaryKpiCard key={kpi.label} {...kpi} delay={0.1 + 0.05 * i} />
          ))}
        </div>
      )}

      {/* ── Alert Cards (Low Stock, Out of Stock, Expired) ────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AlertKpiCard
            label="Low Stock Items" value={kpis.lowStockCount}
            icon={AlertTriangle} variant="warning"
            sub="Products below minimum"
            delay={0.2}
          />
          <AlertKpiCard
            label="Out of Stock" value={kpis.outOfStockCount}
            icon={XCircle} variant="danger"
            sub="Products unavailable"
            delay={0.25}
          />
          <AlertKpiCard
            label="Expired Products" value={kpis.expiredCount}
            icon={Clock} variant="danger"
            sub="Past expiry date"
            delay={0.3}
          />
        </div>
      )}

      {/* ── Charts Row 1: Sales Trend + Payment Mode ──────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2"><SkeletonCard className="h-72" /></div>
          <SkeletonCard className="h-72" />
        </div>
      ) : (
        <motion.div {...fadeUp(0.25)} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Sales Trend Line Chart */}
          <div className="xl:col-span-2 glass-card rounded-2xl border border-divider/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-content">Sales Trend</h3>
                <p className="text-xs text-content-muted mt-0.5">Daily revenue for the last 7 days</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <ArrowUp className="h-3 w-3" />12.4% vs last week
              </span>
            </div>
            <div className="h-52">
              <Line
                data={{
                  labels: charts.salesTrend.labels,
                  datasets: [{
                    label: 'Sales (₹)',
                    data: charts.salesTrend.data,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  }]
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: chartTooltip },
                  scales: {
                    x: { grid: chartGrid, ticks: chartTick, border: { display: false } },
                    y: { grid: chartGrid, ticks: { ...chartTick, callback: v => `₹${(v/1000).toFixed(0)}K` }, border: { display: false } },
                  },
                  interaction: { mode: 'index', intersect: false },
                }}
              />
            </div>
          </div>

          {/* Payment Mode Doughnut */}
          <div className="glass-card rounded-2xl border border-divider/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-content">Payment Modes</h3>
              <p className="text-xs text-content-muted mt-0.5">Monthly breakdown</p>
            </div>
            <div className="h-40 flex items-center justify-center">
              <Doughnut
                data={{
                  labels: charts.paymentBreakdown.labels,
                  datasets: [{
                    data: charts.paymentBreakdown.data,
                    backgroundColor: ['rgba(34,197,94,0.8)','rgba(59,130,246,0.8)','rgba(168,85,247,0.8)','rgba(245,158,11,0.8)'],
                    borderColor: ['#22c55e','#3b82f6','#a855f7','#f59e0b'],
                    borderWidth: 2,
                    hoverOffset: 6,
                  }]
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  cutout: '72%',
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: CHART_FONT, padding: 10, boxWidth: 10, boxHeight: 10, usePointStyle: true } },
                    tooltip: { ...chartTooltip },
                  },
                }}
              />
            </div>
            {/* Payment mode summary */}
            <div className="mt-3 space-y-2">
              {charts.paymentBreakdown.labels.map((mode, i) => {
                const colors = ['text-primary-400','text-blue-400','text-violet-400','text-amber-400'];
                const pct = charts.paymentBreakdown.data.reduce((a,b)=>a+b,0);
                return (
                  <div key={mode} className="flex items-center justify-between text-xs">
                    <span className={`${colors[i]} font-medium`}>{mode}</span>
                    <span className="text-content-muted">{formatCurrency(charts.paymentBreakdown.data[i] || 0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Charts Row 2: Monthly Revenue + Inventory Status ─────────────────── */}
      {!loading && (
        <motion.div {...fadeUp(0.3)} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Monthly Revenue Bar */}
          <div className="glass-card rounded-2xl border border-divider/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-content">Monthly Revenue</h3>
                <p className="text-xs text-content-muted mt-0.5">Last 6 months performance</p>
              </div>
            </div>
            <div className="h-52">
              <Bar
                data={{
                  labels: charts.monthlyRevenue.labels,
                  datasets: [
                    {
                      label: 'Revenue (₹)',
                      data: charts.monthlyRevenue.revenue,
                      backgroundColor: 'rgba(34,197,94,0.7)',
                      borderColor: '#22c55e',
                      borderWidth: 1.5,
                      borderRadius: 6,
                      borderSkipped: false,
                      hoverBackgroundColor: 'rgba(34,197,94,0.9)',
                    },
                  ]
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { ...chartTooltip },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: chartTick, border: { display: false } },
                    y: { grid: chartGrid, ticks: { ...chartTick, callback: v => `₹${(v/1000).toFixed(0)}K` }, border: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          {/* Inventory Status */}
          <div className="glass-card rounded-2xl border border-divider/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-content">Inventory Status</h3>
                <p className="text-xs text-content-muted mt-0.5">Stock level breakdown</p>
              </div>
            </div>
            <div className="h-36 mb-4">
              <Doughnut
                data={{
                  labels: charts.inventory.labels,
                  datasets: [{
                    data: charts.inventory.data,
                    backgroundColor: ['rgba(34,197,94,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'],
                    borderColor: ['#22c55e','#f59e0b','#ef4444'],
                    borderWidth: 2, hoverOffset: 6,
                  }]
                }}
                options={{
                  responsive: true, maintainAspectRatio: false, cutout: '68%',
                  plugins: {
                    legend: { position:'bottom', labels: { color:'#94a3b8', font: CHART_FONT, padding:10, boxWidth:10, usePointStyle:true } },
                    tooltip: { ...chartTooltip, callbacks: { label: ctx => ` ${ctx.raw} products` } },
                  },
                }}
              />
            </div>
            {/* Stock summary row */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label:'In Stock',    val: charts.inventory.data[0], color:'text-emerald-400', bg:'bg-emerald-500/10 border-emerald-500/20' },
                { label:'Low Stock',   val: charts.inventory.data[1], color:'text-amber-400',   bg:'bg-amber-500/10 border-amber-500/20'   },
                { label:'Out of Stock',val: charts.inventory.data[2], color:'text-red-400',     bg:'bg-red-500/10 border-red-500/20'       },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.bg}`}>
                  <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] text-content-muted leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Bottom Row: Top Products + Low Stock + Recent Bills ──────────────── */}
      {!loading && (
        <motion.div {...fadeUp(0.35)} className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Top Selling Products */}
          <div className="glass-card rounded-2xl border border-divider/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-content">Top Products</h3>
              <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">This Month</span>
            </div>
            <div className="space-y-3">
              {(data?.topProducts || DEMO.topProducts).map((p, i) => {
                const max = (data?.topProducts || DEMO.topProducts)[0]?.revenue || 1;
                const pct = Math.round((p.revenue / max) * 100);
                const colors = ['bg-primary-500','bg-blue-500','bg-violet-500','bg-amber-500'];
                return (
                  <div key={p._id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-content truncate max-w-[60%]">{p._id}</span>
                      <span className="text-content-muted font-medium shrink-0">{formatCurrency(p.revenue, true)}</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                        className={`h-full rounded-full ${colors[i % colors.length]}`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-600">{p.qty} units sold</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="glass-card rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-content">Low Stock Alert</h3>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {kpis.lowStockCount} items
              </span>
            </div>
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {(data?.lowStockItems || DEMO.lowStockItems).map(item => (
                <div key={item._id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-content truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-600">{item.sku}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-bold text-amber-400">{item.stock} {item.unit}</p>
                    <p className="text-[10px] text-slate-600">min: {item.minStock}</p>
                  </div>
                </div>
              ))}
              {(data?.outOfStockItems || DEMO.outOfStockItems).map(item => (
                <div key={item._id} className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-content truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-600">{item.sku}</p>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                    OUT
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bills */}
          <div className="glass-card rounded-2xl border border-divider/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-content">Recent Bills</h3>
              <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-0.5">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {(data?.recentBills || DEMO.recentBills).map(bill => (
                <div key={bill._id || bill.invoiceNo} className="flex items-center justify-between p-2.5 rounded-xl bg-surface/50 border border-divider/30 hover:border-divider/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-content truncate">{bill.customerName}</p>
                    <p className="text-[10px] text-slate-600">{bill.invoiceNo}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-bold text-content">{formatCurrency(bill.grandTotal)}</p>
                    <StatusBadge status={bill.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Last refresh ─────────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-slate-700 pb-2">
        Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const PrimaryKpiCard = ({ label, value, format, sub, icon: Icon, color, border, text, glow, trend, delay }) => (
  <motion.div {...fadeUp(delay)}
    className={`glass-card rounded-2xl border ${border} p-5 shadow-lg ${glow} hover:scale-[1.01] transition-transform duration-200`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} border ${border} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${text}`} />
      </div>
      <span className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(trend)}%
      </span>
    </div>
    <p className={`text-2xl font-bold ${text} mb-0.5`}>
      {format === 'currency' ? formatCurrency(value, value > 99999) : value?.toLocaleString('en-IN')}
    </p>
    <p className="text-xs font-semibold text-content">{label}</p>
    <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>
  </motion.div>
);

const SecondaryKpiCard = ({ label, value, format, sub, icon: Icon, color, border, text, delay }) => (
  <motion.div {...fadeUp(delay)}
    className={`glass-card rounded-2xl border ${border} p-4 hover:scale-[1.01] transition-transform duration-200`}>
    <div className="flex items-center gap-3">
      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${color} border ${border} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4.5 w-4.5 ${text}`} style={{ height: '18px', width: '18px' }} />
      </div>
      <div className="min-w-0">
        <p className={`text-lg font-bold ${text}`}>
          {format === 'currency' ? formatCurrency(value, true) : value?.toLocaleString('en-IN')}
        </p>
        <p className="text-xs font-semibold text-content">{label}</p>
        <p className="text-[10px] text-slate-600 truncate">{sub}</p>
      </div>
    </div>
  </motion.div>
);

const AlertKpiCard = ({ label, value, icon: Icon, variant, sub, delay }) => {
  const styles = {
    warning: { bg: 'from-amber-500/15 to-orange-500/5', border: 'border-amber-500/25', text: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/20' },
    danger:  { bg: 'from-red-500/15 to-rose-500/5',    border: 'border-red-500/25',   text: 'text-red-400',   badge: 'bg-red-500/10 border-red-500/20'   },
  };
  const s = styles[variant];
  return (
    <motion.div {...fadeUp(delay)}
      className={`glass-card rounded-2xl border ${s.border} p-5 bg-gradient-to-br ${s.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${s.badge} border flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${s.text}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${s.text}`}>{value}</p>
            <p className="text-xs font-semibold text-content">{label}</p>
            <p className="text-[10px] text-slate-600">{sub}</p>
          </div>
        </div>
        {value > 0 && (
          <span className={`text-[10px] font-bold ${s.text} ${s.badge} border px-2 py-1 rounded-full animate-pulse`}>
            Action Required
          </span>
        )}
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Paid:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Partial:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Credit:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${styles[status] || styles.Paid}`}>
      {status}
    </span>
  );
};

export default Dashboard;
