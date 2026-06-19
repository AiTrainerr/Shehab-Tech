import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getStorageStats } from "@/app/actions/storage"
import { getAuditLogs } from "@/app/actions/audit"
import { StorageLogsPanel } from "@/components/storage-logs-panel"

export const dynamic = 'force-dynamic'

export default async function AdminStoragePage() {
  const stats = await getStorageStats()
  const logs = await getAuditLogs()

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Overview
          </Link>
          <h1 className="text-3xl font-black text-foreground">Storage Governance & Audit History</h1>
          <p className="text-foreground/70">
            Monitor storage limits, execute file retention cleanups, and track operations.
          </p>
        </div>

        <StorageLogsPanel initialStats={stats} initialLogs={logs} />
      </div>
    </div>
  )
}
