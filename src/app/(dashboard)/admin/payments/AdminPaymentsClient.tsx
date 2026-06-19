"use client"

import * as React from "react"
import { DollarSign, Check, Clock, Search } from "lucide-react"
import { markApplicationPaid } from "@/app/actions/projects"

interface PaymentApp {
  id: string
  status: string
  updatedAt: Date
  project: { id: string; title: string; price: number | null }
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    paymentMethod: string | null
    paymentId: string | null
    paymentEmail: string | null
  }
}

interface Props {
  pendingPayments: PaymentApp[]
  paidPayments: PaymentApp[]
}

export function AdminPaymentsClient({ pendingPayments, paidPayments }: Props) {
  const [activeTab, setActiveTab] = React.useState<"pending" | "paid">("pending")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm("Are you sure you want to mark this payout as paid? (هل أنت متأكد من تحديد هذه الدفعة كمدفوعة؟)")) return
    setLoadingId(id)
    const result = await markApplicationPaid(id)
    if (result.success) {
      alert("Successfully marked as paid! (تم تحديد الدفعة كمدفوعة بنجاح)")
    } else {
      alert(result.error || "An error occurred.")
    }
    setLoadingId(null)
  }

  const currentList = activeTab === "pending" ? pendingPayments : paidPayments

  const filtered = currentList.filter(app => {
    const term = searchTerm.toLowerCase()
    return (
      app.user.firstName.toLowerCase().includes(term) ||
      app.user.lastName.toLowerCase().includes(term) ||
      app.user.email.toLowerCase().includes(term) ||
      app.project.title.toLowerCase().includes(term) ||
      (app.user.paymentMethod || "").toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-px">
        <button
          onClick={() => { setActiveTab("pending"); setSearchTerm(""); }}
          className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 relative -bottom-[2px] flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Payouts ({pendingPayments.length})
        </button>
        <button
          onClick={() => { setActiveTab("paid"); setSearchTerm(""); }}
          className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 relative -bottom-[2px] flex items-center gap-2 ${
            activeTab === "paid"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          <Check className="w-4 h-4" /> Payout History ({paidPayments.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search by name, project, method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card border-b border-border text-foreground/70 font-semibold text-sm">
                <th className="p-4 sm:p-5">Freelancer (المستقل)</th>
                <th className="p-4 sm:p-5">Project & Price (المشروع)</th>
                <th className="p-4 sm:p-5">Payment Method (طريقة الدفع)</th>
                <th className="p-4 sm:p-5">Payment Details (بيانات الدفع)</th>
                <th className="p-4 sm:p-5">Date</th>
                {activeTab === "pending" && <th className="p-4 sm:p-5 text-right">Actions (الخيارات)</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className="border-b border-border hover:bg-card/50 transition-colors text-sm">
                  <td className="p-4 sm:p-5">
                    <div className="font-bold text-foreground">{app.user.firstName} {app.user.lastName}</div>
                    <div className="text-xs text-foreground/50">{app.user.email}</div>
                  </td>
                  <td className="p-4 sm:p-5">
                    <div className="font-medium text-foreground">{app.project.title}</div>
                    <div className="text-xs font-bold text-primary mt-0.5">${app.project.price?.toFixed(2) ?? "0.00"}</div>
                  </td>
                  <td className="p-4 sm:p-5">
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                      {app.user.paymentMethod || "Not Set"}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5">
                    {app.user.paymentMethod ? (
                      <div className="space-y-0.5">
                        {app.user.paymentId && (
                          <div className="text-xs">
                            <span className="text-foreground/50">ID/Num:</span> <span className="font-mono font-semibold">{app.user.paymentId}</span>
                          </div>
                        )}
                        {app.user.paymentEmail && (
                          <div className="text-xs">
                            <span className="text-foreground/50">Email:</span> <span className="font-semibold">{app.user.paymentEmail}</span>
                          </div>
                        )}
                        {!app.user.paymentId && !app.user.paymentEmail && (
                          <span className="text-xs text-foreground/40 italic">No details entered</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-foreground/40 italic">Not configured by user</span>
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-xs text-foreground/60">
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </td>
                  {activeTab === "pending" && (
                    <td className="p-4 sm:p-5 text-right">
                      <button
                        onClick={() => handleMarkAsPaid(app.id)}
                        disabled={loadingId === app.id}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-green-500/10 flex items-center gap-1.5 ml-auto"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        {loadingId === app.id ? "Processing..." : "Mark as Paid (تم الدفع)"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={activeTab === "pending" ? 6 : 5} className="p-8 text-center text-foreground/50">
                    No records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
