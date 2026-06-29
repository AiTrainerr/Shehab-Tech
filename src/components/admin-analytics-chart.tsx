"use client"

import * as React from "react"
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

// ─── Types ───────────────────────────────────────────────────────────────────
interface DayData    { date: string; users: number; projects?: number }
interface StatusData { name: string; value: number; color: string }
interface EarningsData { month: string; earnings: number }
interface QCData { status: string; count: number; color: string }

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-xl text-sm">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Users Growth Line Chart ──────────────────────────────────────────────────
export function UsersGrowthChart({ data }: { data: DayData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }} />
        <YAxis tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="users"
          name="مستخدم جديد"
          stroke="var(--primary)"
          strokeWidth={2.5}
          dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "var(--primary)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Project Status Pie Chart ─────────────────────────────────────────────────
const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ProjectStatusPieChart({ data }: { data: StatusData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={85}
          dataKey="value"
          labelLine={false}
          label={PieLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, color: "var(--foreground)", opacity: 0.7 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Earnings Bar Chart ───────────────────────────────────────────────────────
export function EarningsBarChart({ data }: { data: EarningsData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }} />
        <YAxis tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="earnings" name="أرباح ($)" fill="var(--primary)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── QC Distribution Bar Chart ────────────────────────────────────────────────
export function RecordingQCChart({ data }: { data: QCData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }} />
        <YAxis tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="تسجيلات" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
