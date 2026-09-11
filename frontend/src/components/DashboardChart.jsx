import React, { useState } from 'react';

const DashboardChart = ({ salesGraph = {} }) => {
  const [interval, setInterval] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [activePoint, setActivePoint] = useState(null);

  // Retrieve current active dataset
  const data = salesGraph[interval] || [];

  if (data.length === 0) return null;

  // Chart view proportions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const salesValues = data.map(d => d.sales);
  const maxSales = Math.max(...salesValues, 5000);
  const minSales = 0;
  const salesRange = maxSales - minSales;

  // Map coordinates for line trend points
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.sales - minSales) / salesRange) * chartHeight;
    return { x, y, val: d.sales, day: d.day, transactions: d.transactions };
  });

  // Construct SVG command line path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }

  // Construct closed gradient fill block
  let areaD = '';
  if (points.length > 0) {
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Y-axis ticks mapping
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Trend Line Chart */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-content font-semibold text-base font-sans capitalize">{interval} Revenue Trend (Rs)</h3>
          
          {/* Interval Selector Tabs */}
          <div className="flex bg-surface border border-divider rounded-xl p-1 shrink-0 self-start">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setInterval(t);
                  setActivePoint(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg font-sans capitalize cursor-pointer transition-all duration-150 ${
                  interval === t
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-content-muted hover:text-content'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {yTicks.map((t, idx) => {
              const y = paddingTop + chartHeight - t * chartHeight;
              const value = Math.round(minSales + t * salesRange);
              return (
                <g key={idx} className="opacity-20">
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={svgWidth - paddingRight} 
                    y2={y} 
                    stroke="#94a3b8" 
                    strokeWidth="0.75" 
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={paddingLeft - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    fill="#94a3b8" 
                    className="text-[10px] font-semibold font-sans"
                  >
                    {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  </text>
                </g>
              );
            })}

            {/* Gradient shadow area */}
            {areaD && (
              <path d={areaD} fill="url(#areaGrad)" className="transition-all duration-300" />
            )}

            {/* Main vector line */}
            {pathD && (
              <path 
                d={pathD} 
                fill="none" 
                stroke="url(#lineGrad)" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Interaction circle markers */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4.5" 
                  fill="#0f172a" 
                  stroke="#22c55e" 
                  strokeWidth="2.5" 
                  className="transition-all duration-150 hover:scale-125 cursor-pointer"
                  onMouseEnter={() => setActivePoint(p)}
                  onMouseLeave={() => setActivePoint(null)}
                />
                <text 
                  x={p.x} 
                  y={paddingTop + chartHeight + 18} 
                  textAnchor="middle" 
                  fill="#64748b" 
                  className="text-[10px] font-bold font-sans"
                >
                  {p.day}
                </text>
              </g>
            ))}
          </svg>

          {/* Sales Tooltip */}
          {activePoint && !activePoint.xBar && (
            <div 
              className="absolute bg-surface/90 border border-divider/80 px-3 py-2 rounded-xl text-[10px] shadow-2xl flex flex-col pointer-events-none transition-all duration-150 z-20 text-slate-100"
              style={{
                left: `${((activePoint.x - paddingLeft) / chartWidth) * 80 + 8}%`,
                top: `${((activePoint.y - paddingTop) / chartHeight) * 45 + 5}%`,
              }}
            >
              <span className="text-content-muted font-sans font-medium">{activePoint.day} Data</span>
              <span className="text-content font-bold font-sans mt-0.5">Sales: Rs {activePoint.val.toLocaleString()}</span>
              <span className="text-primary-400 font-sans font-semibold mt-0.5">Bills: {activePoint.transactions}</span>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Volumes Bar Chart */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <h3 className="text-content font-semibold text-base mb-6 font-sans capitalize">{interval} Transactions Count</h3>

        <div className="relative">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
            {/* Grid ticks mapping */}
            {yTicks.map((t, idx) => {
              const y = paddingTop + chartHeight - t * chartHeight;
              const maxTransactions = Math.max(...data.map(d => d.transactions), 10);
              const value = Math.round(t * maxTransactions);
              return (
                <g key={idx} className="opacity-20">
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={svgWidth - paddingRight} 
                    y2={y} 
                    stroke="#94a3b8" 
                    strokeWidth="0.75" 
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={paddingLeft - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    fill="#94a3b8" 
                    className="text-[10px] font-semibold font-sans"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* SVG Rectangle render */}
            {data.map((d, index) => {
              const maxTransactions = Math.max(...data.map(item => item.transactions), 10);
              const barWidth = 20;
              const x = paddingLeft + (index / (data.length - 1)) * chartWidth - barWidth / 2;
              const barHeight = (d.transactions / maxTransactions) * chartHeight;
              const y = paddingTop + chartHeight - barHeight;

              return (
                <g key={index} className="group cursor-pointer">
                  <rect 
                    x={x} 
                    y={y} 
                    width={barWidth} 
                    height={Math.max(barHeight, 2)} 
                    rx="3"
                    fill="url(#barGrad)"
                    className="transition-all duration-300 hover:opacity-85"
                  />
                  {/* Hover sensor overlay */}
                  <rect 
                    x={x - 10} 
                    y={paddingTop} 
                    width={barWidth + 20} 
                    height={chartHeight} 
                    fill="transparent"
                    onMouseEnter={() => setActivePoint({ day: d.day, val: d.sales, transactions: d.transactions, x, y, xBar: true })}
                    onMouseLeave={() => setActivePoint(null)}
                  />
                  <text 
                    x={x + barWidth / 2} 
                    y={paddingTop + chartHeight + 18} 
                    textAnchor="middle" 
                    fill="#64748b" 
                    className="text-[10px] font-bold font-sans"
                  >
                    {d.day}
                  </text>
                </g>
              );
            })}

            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Bar Tooltip */}
          {activePoint && activePoint.xBar && (
            <div 
              className="absolute bg-surface/90 border border-divider/80 px-3 py-2 rounded-xl text-[10px] shadow-2xl flex flex-col pointer-events-none transition-all duration-150 z-20 text-slate-100"
              style={{
                left: `${((activePoint.x - paddingLeft) / chartWidth) * 80 + 8}%`,
                top: `35%`,
              }}
            >
              <span className="text-content-muted font-sans font-medium">{activePoint.day} Volumes</span>
              <span className="text-content font-bold font-sans mt-0.5">Invoices: {activePoint.transactions}</span>
              <span className="text-blue-400 font-sans font-semibold mt-0.5">Sales: Rs {activePoint.val.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardChart;
