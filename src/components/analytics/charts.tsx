"use client"

import * as React from "react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts'
import { Users, Folder, ShieldCheck } from "lucide-react"

export function UserGrowthChart({ data }: { data: any[] }) {
  return (
    <div className="glass p-6 rounded-2xl border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-foreground">User Growth Over Time</h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="currentColor" fontSize={12} tickMargin={10} className="text-foreground/50" />
            <YAxis stroke="currentColor" fontSize={12} className="text-foreground/50" />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="count" name="New Users" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#ef4444', '#8b5cf6'];

export function ProjectStatusChart({ data }: { data: any[] }) {
  return (
    <div className="glass p-6 rounded-2xl border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
          <Folder className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Projects by Status</h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: '#22c55e',
  REJECTED: '#ef4444',
  PENDING: '#f59e0b',
  NEED_RE_RECORD: '#8b5cf6'
};

export function RecordingQCChart({ data }: { data: any[] }) {
  return (
    <div className="glass p-6 rounded-2xl border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Recordings QC Distribution</h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="status" stroke="currentColor" fontSize={12} className="text-foreground/50" />
            <YAxis stroke="currentColor" fontSize={12} className="text-foreground/50" />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" name="Recordings" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
