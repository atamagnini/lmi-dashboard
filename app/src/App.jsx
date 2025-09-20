import React, { useEffect, useMemo, useState } from 'react'
import * as d3 from 'd3'
import {
  ResponsiveContainer, BarChart, Bar, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Treemap
} from 'recharts'

/**
 * Formats big integers with thousands separators.
 */
function formatNumber(n) {
  return (typeof n === 'number') ? n.toLocaleString() : n
}

/**
 * Shortens long company names to keep x-axis clean.
 */
function shortName(name, max = 16) {
  if (!name) return ''
  return name.length > max ? name.slice(0, max - 1) + '…' : name
}

/** Custom tooltip for the bar chart */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  const v = payload[0].value
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', padding:8, borderRadius:6 }}>
      <div style={{ fontWeight:600, marginBottom:2 }}>{label}</div>
      <div>Job postings: <b>{formatNumber(v)}</b></div>
    </div>
  )
}

/** Custom value label on top of each bar */
const ValueLabel = (props) => {
  const { x, y, width, value } = props
  if (value == null) return null
  // avoid drawing label if the bar is too thin (prevents overlap)
  if (width < 12) return null
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      className="lmi-barlabel"
    >
      {formatNumber(value)}
    </text>
  )
}

export default function App() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  // Read dataUrl from global OR from the mount node data attribute (fallback)
  const mount = typeof document !== 'undefined' ? document.getElementById('lmi-dashboard-root') : null
  const dataUrl =
    (typeof window !== 'undefined' && window.LMI_DASHBOARD && window.LMI_DASHBOARD.dataUrl) ||
    (mount && mount.dataset && mount.dataset.csvUrl)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        if (!dataUrl) throw new Error('Missing dataUrl')
        const data = await d3.csv(dataUrl, d => ({
          company: (d.grouped_company || '').trim(),
          state: (d.state || '').trim(),
          count: +d.job_posting_count || 0,
        }))
        if (isMounted) setRows(data)
      } catch (e) {
        if (isMounted) setError(e.message || 'Load error')
      }
    }
    load()
    return () => { isMounted = false }
  }, [dataUrl])

  // 1) Top 10 companies (sum counts per company)
  const topCompanies = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const k = r.company || 'Unknown'
      map.set(k, (map.get(k) || 0) + r.count)
    }
    return Array.from(map, ([company, total]) => ({ company, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [rows])

  // 2) Top states for treemap (same as antes)
  const treemapStates = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const k = r.state || 'Unknown'
      map.set(k, (map.get(k) || 0) + r.count)
    }
    const top10 = Array.from(map, ([state, total]) => ({ state, total }))
      .filter(d => d.state && d.state !== 'Unknown')
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
    return top10.map(d => ({ name: d.state, size: d.total }))
  }, [rows])

  const TreemapTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const { name, size } = payload[0].payload
    return (
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', padding:8, borderRadius:6 }}>
        <div style={{ fontWeight:600 }}>{name}</div>
        <div>Job postings: {formatNumber(size)}</div>
      </div>
    )
  }

  if (error) return <div style={{ padding:12, color:'crimson' }}>Error loading CSV: {error}</div>
  if (!rows.length) return <div style={{ padding:12 }}>Loading data…</div>

  return (
    <div className="lmi-wrap">
      <h2 className="lmi-title">LMI Dashboard</h2>
      <div className="lmi-grid">
      {/* === Bar chart (beautified) === */}
        <div className="lmi-card">
            <h3 className="lmi-subtitle">Top 10 Companies by Job Postings</h3>
            <div className="lmi-chart">
            <ResponsiveContainer width="100%" height={340}>
                <BarChart
                data={topCompanies}
                margin={{ top: 20, right: 24, left: 6, bottom: 46 }}
                >
                {/* gradient for the bars */}
                <defs>
                    <linearGradient id="lmiBarGradient" x1="0" y1="0" x2="0" y2="1">
                    {/* darker at top, lighter at bottom */}
                    <stop offset="0%" stopColor="#1D48C0" stopOpacity={0.95}/>
                    <stop offset="100%" stopColor="#1D48C0" stopOpacity={0.65}/>
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />

                <XAxis
                    dataKey="company"
                    tickFormatter={(v) => shortName(v, 14)} 
                    angle={-30}                             
                    textAnchor="end"
                    interval="preserveStartEnd"              
                    tick={{ fontSize: 11 }}                  
                    tickMargin={8}                        
                    height={52}                             
                    />

                <YAxis
                    tickFormatter={formatNumber}
                    tick={{ fontSize: 11 }}                
                    width={52}                             
                    />

                <Tooltip content={<BarTooltip />} />

                <Bar
                    dataKey="total"
                    name="Job postings"
                    fill="url(#lmiBarGradient)"
                    radius={[8, 8, 0, 0]}   // rounded top corners
                    maxBarSize={60}         // avoids overly thick bars
                >
                    {/* value labels on top of bars */}
                    <LabelList dataKey="total" content={<ValueLabel />} />
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* === Treemap stays as second chart === */}
        <div className="lmi-card">
            <h3 className="lmi-subtitle">Top 10 States by Job Postings</h3>
            <div className="lmi-chart">
            <ResponsiveContainer width="100%" height={320}>
                <Treemap
                data={treemapStates}
                dataKey="size"
                nameKey="name"
                ratio={4/3}
                isAnimationActive={true}
                stroke="#fff"
                >
                <Tooltip content={<TreemapTooltip />} />
                </Treemap>
            </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  )
}
