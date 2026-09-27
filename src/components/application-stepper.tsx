import { CheckCircle, Clock, DollarSign, Search, Users, Lock } from "lucide-react"

interface ApplicationStepperProps {
  status: string
}

interface Step {
  id: number
  label: string
  labelAr: string
  description: string
  icon: React.ElementType
  statuses: string[] // DB statuses that map to "this step is active/current"
  completedStatuses: string[] // DB statuses that mean this step is DONE
}

const STEPS: Step[] = [
  {
    id: 1,
    label: "Working",
    labelAr: "قيد التنفيذ",
    description: "You have been accepted and are completing your tasks.",
    icon: Clock,
    statuses: ["ACCEPTED", "WORKING"],
    completedStatuses: ["UNDER_REVIEW", "FINAL_REVIEW", "APPROVED", "PAID"],
  },
  {
    id: 2,
    label: "QA1 Review",
    labelAr: "مراجعة QA1",
    description: "Your work is being reviewed by our first quality reviewer.",
    icon: Search,
    statuses: ["UNDER_REVIEW"],
    completedStatuses: ["FINAL_REVIEW", "APPROVED", "PAID"],
  },
  {
    id: 3,
    label: "QA2 / Client",
    labelAr: "QA2 / العميل",
    description: "Final review stage — approved by client or second QA.",
    icon: Users,
    statuses: ["FINAL_REVIEW"],
    completedStatuses: ["APPROVED", "PAID"],
  },
  {
    id: 4,
    label: "Paid",
    labelAr: "تم الدفع",
    description: "Your payout has been processed successfully.",
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

export function ApplicationStepper({ status }: ApplicationStepperProps) {
  const isRejected = status === "REJECTED"
  const isPending = status === "PENDING"

  if (isPending) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <Clock className="w-5 h-5 text-yellow-500 shrink-0 animate-pulse" />
        <div>
          <p className="font-bold text-yellow-600 dark:text-yellow-400">Pending Review</p>
          <p className="text-xs text-foreground/60 mt-0.5">Your application is awaiting admin approval. (قيد الانتظار)</p>
        </div>
      </div>
    )
  }

  if (isRejected) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <Lock className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="font-bold text-red-500">Application Rejected</p>
          <p className="text-xs text-foreground/60 mt-0.5">Unfortunately your application was not accepted. (تم الرفض)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Mobile: vertical layout */}
      <div className="flex flex-col gap-0 sm:hidden">
        {STEPS.map((step, idx) => {
          const state = getStepState(step, status)
          const Icon = step.icon
          return (
            <div key={step.id} className="flex gap-4">
              {/* Left: dot + line */}
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
                  <span className="font-normal text-foreground/50 mr-1 text-xs"> · {step.labelAr}</span>
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
                  <div className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${
                    state === "completed" ? "bg-green-400" : "bg-border"
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
              <div key={step.id} className="flex-1 last:flex-none pr-2">
                <p className={`text-xs font-bold leading-tight ${
                  state === "current" ? "text-primary" :
                  state === "completed" ? "text-green-600 dark:text-green-400" :
                  "text-foreground/40"
                }`}>
                  {step.label}
                </p>
                <p className={`text-[10px] mt-0.5 ${
                  state === "current" ? "text-foreground/60" : "text-foreground/30"
                }`}>
                  {step.labelAr}
                </p>
                {state === "current" && (
                  <p className="text-[10px] text-primary/70 mt-1 leading-relaxed max-w-[120px]">
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
        {status === "PAID" && "💰 Paid — تم الدفع"}
        {status === "APPROVED" && "✅ Client Approved — تم قبول العميل"}
        {status === "FINAL_REVIEW" && "🔍 QA2 Review — المراجعة الثانية"}
        {status === "UNDER_REVIEW" && "🔎 QA1 Review — المراجعة الأولى"}
        {(status === "WORKING" || status === "ACCEPTED") && "⚡ Working — قيد التنفيذ"}
      </div>
    </div>
  )
}
