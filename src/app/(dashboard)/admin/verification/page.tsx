import * as React from "react"
import Link from "next/link"
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { approveVerification, rejectVerification } from "@/app/actions/verification"
import { revalidatePath } from "next/cache"

export default async function VerificationPage() {
  const pendingUsers = await prisma.user.findMany({
    where: { verificationStatus: "PENDING" },
    select: { id: true, firstName: true, lastName: true, email: true, idCardUrl: true, selfieUrl: true }
  })

  async function handleApprove(formData: FormData) {
    "use server"
    const id = formData.get("userId") as string
    await approveVerification(id)
    revalidatePath("/admin/verification")
  }

  async function handleReject(formData: FormData) {
    "use server"
    const id = formData.get("userId") as string
    await rejectVerification(id)
    revalidatePath("/admin/verification")
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-500" /> Verification Requests
          </h1>
          <p className="text-foreground/70">Review submitted ID cards and selfies to verify members.</p>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-border text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
            <p className="text-foreground/70">There are no pending verification requests.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingUsers.map((user) => (
              <div key={user.id} className="glass p-6 rounded-2xl border border-border">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-foreground/60">{user.email}</p>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {user.idCardUrl && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-foreground/60">ID Card</span>
                          <a href={user.idCardUrl} target="_blank" rel="noreferrer">
                            <img src={user.idCardUrl} alt="ID Card" className="h-32 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                          </a>
                        </div>
                      )}
                      {user.selfieUrl && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-foreground/60">Selfie</span>
                          <a href={user.selfieUrl} target="_blank" rel="noreferrer">
                            <img src={user.selfieUrl} alt="Selfie" className="h-32 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 justify-center min-w-[140px]">
                    <form action={handleApprove}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold rounded-xl transition-colors border border-green-500/20">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                    </form>
                    <form action={handleReject}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-colors border border-red-500/20">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
