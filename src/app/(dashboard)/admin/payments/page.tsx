"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Activity } from "lucide-react"

export default function PaymentsPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3"><Activity className="w-8 h-8"/> Payments Overview</h1>
          <p className="text-foreground/70">Manage payouts and view platform revenue.</p>
        </div>
        <div className="glass p-8 rounded-2xl border border-border flex items-center justify-center min-h-[400px]">
          <p className="text-foreground/60 font-semibold">Payment processing backend integration in progress...</p>
        </div>
      </div>
    </main>
  )
}
