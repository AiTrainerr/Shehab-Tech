"use client"

import * as React from "react"
import { Clock, Search, Users, DollarSign, CheckCircle } from "lucide-react"

interface ApplicationStepperProps {
  status: string
  className?: string
}

interface Step {
  id: number
  label: string
  sublabel: string
  description: string
  icon: React.ElementType
  statuses: string[]
  completedStatuses: string[]
}

const STEPS: Step[] = [
  {
    id: 1,
    label: "Recording",
    sublabel: "Task Session",
    description: "Application accepted. Recording tasks in progress.",
    icon: Clock,
    statuses: ["ACCEPTED", "WORKING"],
    completedStatuses: ["UNDER_REVIEW", "FINAL_REVIEW", "APPROVED", "PAID"],
  },
  {
    id: 2,
    label: "Platform Review",
    sublabel: "QA1 Check",
    description: "Recordings submitted. Under initial quality check.",
    icon: Search,
    statuses: ["UNDER_REVIEW"],
    completedStatuses: ["FINAL_REVIEW", "APPROVED", "PAID"],
  },
  {
    id: 3,
    label: "Client Review",
    sublabel: "Final Review",
    description: "Platform QA passed. Under final client review & verification.",
    icon: Users,
    statuses: ["FINAL_REVIEW"],
    completedStatuses: ["APPROVED", "PAID"],
  },
  {
    id: 4,
    label: "Payout",
    sublabel: "Completion",
    description: "Final approval granted. Payment released & transferred.",
    icon: DollarSign,
    statuses: ["APPROVED", "PAID"],
    completedStatuses: [],
  },
]

function getStepState(step: Step, status: string): "completed" | "current" | "upcoming" {
  if (step.completedStatuses.includes(status)) return "completed"
  if (step.statuses.includes(status)) return "current"
  return "upcoming"
}

export function ApplicationStepper({ status, className = "" }: ApplicationStepperProps) {
  // If rejected, show clear rejection banner
  if (status === "REJECTED") {
    return (
      <div className={`p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-2 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <span>Application Rejected — This submission did not meet the required specifications.</span>
      </div>
    )
  }

  // If pending initial approval
  if (status === "PENDING") {
    return (
      <div className={`p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400 text-sm font-semibold flex items-center gap-2 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0 animate-ping" />
        <span>Application Pending Review — Awaiting project supervisor approval.</span>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile: vertical stepper */}
      <div className="block sm:hidden space-y-4">
        {STEPS.map((step, idx) => {
          const state = getStepState(step, status)
          const Icon = step.icon
          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Left: icon with connecting line */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                  state === "completed"
                    ? "bg-green-500 border-green-500 text-white"
                    : state === "current"
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 animate-glow-pulse"
                    : "bg-background border-border text-foreground/30"
                }`}>
                  {state === "completed" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${
                    state === "completed" ? "bg-green-500" : "bg-border"
                  }`} />
                )}
              </div>
              {/* Right: text */}
              <div className={`pb-6 ${idx === STEPS.length - 1 ? "pb-0" : ""}`}>
                <p className={`font-bold text-sm leading-tight ${
                  state === "current" ? "text-primary" :
                  state === "completed" ? "text-green-600 dark:text-green-400" :
                  "text-foreground/40"
                }`}>
                  {step.label}
                  <span className="font-normal text-foreground/50 ml-1 text-xs"> · {step.sublabel}</span>
                </p>
                {state === "current" && (
                  <p className="text-xs text-foreground/60 mt-0.5 leading-relaxed">{step.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: horizontal layout */}
      <div className="hidden sm:block">
        {/* Step circles + connector line */}
        <div className="flex items-center mb-4">
          {STEPS.map((step, idx) => {
            const state = getStepState(step, status)
            const Icon = step.icon
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    state === "completed"
                      ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20"
                      : state === "current"
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 animate-glow-pulse"
                      : "bg-background border-border text-foreground/30"
                  }`}>
                    {state === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                </div>
                {/* Connector line between steps */}
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                    state === "completed" ? "bg-green-500" : "bg-border"
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step labels */}
        <div className="flex">
          {STEPS.map((step) => {
            const state = getStepState(step, status)
            return (
              <div key={step.id} className="flex-1 last:flex-none pr-3">
                <p className={`text-xs font-bold leading-tight ${
                  state === "current" ? "text-primary" :
                  state === "completed" ? "text-green-600 dark:text-green-400" :
                  "text-foreground/40"
                }`}>
                  {step.label}
                </p>
                <p className={`text-[11px] mt-0.5 font-medium ${
                  state === "current" ? "text-foreground/60" : "text-foreground/30"
                }`}>
                  {step.sublabel}
                </p>
                {state === "current" && (
                  <p className="text-[11px] text-primary/80 mt-1 leading-relaxed max-w-[130px]">
                    {step.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Status summary pill */}
      <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
        status === "PAID"
          ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
          : status === "APPROVED"
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
          : status === "FINAL_REVIEW"
          ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
          : status === "UNDER_REVIEW"
          ? "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400"
          : "bg-primary/10 text-primary border-primary/20"
      }`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status === "PAID" && "💰 Paid — Payment Processed"}
        {status === "APPROVED" && "✅ Client Approved — Payout Scheduled"}
        {status === "FINAL_REVIEW" && "🔍 Final Client Review — Under Client Verification"}
        {status === "UNDER_REVIEW" && "🔎 Platform Review — Under QA1 Check"}
        {(status === "WORKING" || status === "ACCEPTED") && "⚡ In Progress — Recording Tasks Active"}
      </div>
    </div>
  )
}
