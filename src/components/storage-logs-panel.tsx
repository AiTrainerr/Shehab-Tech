"use client"

import * as React from "react"
import { ShieldAlert, Trash2, BellRing, Database, Clock, Terminal, User, Globe } from "lucide-react"
import { adminExecuteCleanup, checkAndTriggerStorageWarning } from "@/app/actions/storage"

type AuditLogEntry = {
  id: string
  userId: string | null
  username: string | null
  action: string
  details: string
  ipAddress: string | null
  createdAt: Date
}

type StorageStats = {
  totalBytes: number
  usedBytes: number
  remainingBytes: number
  percentageUsed: number
}

interface StorageLogsPanelProps {
  initialStats: StorageStats
  initialLogs: AuditLogEntry[]
}

export function StorageLogsPanel({ initialStats, initialLogs }: StorageLogsPanelProps) {
  const [stats, setStats] = React.useState<StorageStats>(initialStats)
  const [logs, setLogs] = React.useState<AuditLogEntry[]>(initialLogs)
  const [loading, setLoading] = React.useState(false)
  const [showCleanupModal, setShowCleanupModal] = React.useState(false)
  const [cleanupReason, setCleanupReason] = React.useState("")

  const toGB = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(2)

  const handleTriggerWarning = async () => {
    setLoading(true)
    const res = await checkAndTriggerStorageWarning()
    setLoading(false)
    if (res.triggered) {
      alert(`Storage warning notifications sent successfully to ${res.notifiedUsersCount} users!`)
    } else {
      alert(res.message || res.error || "No action taken. Storage levels are normal.")
    }
  }

  const handleExecuteCleanup = async () => {
    if (!cleanupReason.trim()) return
    setLoading(true)
    const res = await adminExecuteCleanup(cleanupReason)
    setLoading(false)
    setShowCleanupModal(false)
    setCleanupReason("")
    if (res.success) {
      alert(`Cleanup executed successfully. Removed ${res.count} expired recording files.`)
      // Refresh stats/logs
      window.location.reload()
    } else {
      alert(res.error || "Failed to execute cleanup")
    }
  }

  return (
    <div className="space-y-8">
      {/* Storage Gauge */}
      <div className="glass p-6 rounded-2xl border border-border">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" /> Storage Space Usage
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>Used: {toGB(stats.usedBytes)} GB</span>
            <span>Limit: {toGB(stats.totalBytes)} GB</span>
          </div>

          <div className="w-full bg-border rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                stats.percentageUsed > 80 ? "bg-red-500" : stats.percentageUsed > 50 ? "bg-yellow-500" : "bg-primary"
              }`}
              style={{ width: `${stats.percentageUsed}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-foreground/50">
            <span>{stats.percentageUsed.toFixed(1)}% Used</span>
            <span>Remaining: {toGB(stats.remainingBytes)} GB</span>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border mt-4">
            <button
              onClick={handleTriggerWarning}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-all text-sm disabled:opacity-50"
            >
              <BellRing className="w-4 h-4" /> Trigger Warning Check
            </button>

            <button
              onClick={() => setShowCleanupModal(true)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all text-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Execute Expired Cleanup
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass p-6 rounded-2xl border border-border">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Terminal className="w-5 h-5 text-primary" /> System Audit Logs
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-foreground/60 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-card/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-foreground/60">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground/90">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary/70" /> {log.username || "Anonymous"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-foreground/60">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-foreground/40" /> {log.ipAddress || "N/A"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground/80 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-foreground/40 font-medium">
                    No log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-6 rounded-3xl border border-border space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-6 h-6 text-red-500" /> Confirm Manual Storage Cleanup
            </h3>
            
            <p className="text-sm text-foreground/75">
              Please enter the specific reason for executing the manual file retention cleanup. This action will be permanently logged in the audit history.
            </p>

            <input
              type="text"
              value={cleanupReason}
              onChange={(e) => setCleanupReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border border-border outline-none focus:border-primary transition-colors text-sm"
              placeholder="e.g. Freeing up critical database space after 24h warning expiration"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCleanupModal(false); setCleanupReason(""); }}
                className="px-4 py-2 text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCleanup}
                disabled={!cleanupReason.trim()}
                className="px-5 py-2 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                Confirm Delete & Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
