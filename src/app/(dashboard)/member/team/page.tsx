import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Users, Link as LinkIcon, Download, ClipboardList, Clock, RefreshCw } from "lucide-react"
import { TeamActions } from "./TeamActions"

export default async function TeamDashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembers: true,
      teamTasks: {
        include: {
          assignedTo: true,
          qcAssignedTo: true,
          project: { select: { title: true } }
        }
      }
    }
  })

  if (!currentUser) redirect("/login")

  const applicationsAsLeader = await prisma.application.count({
    where: { userId, applicationType: "TEAM_LEADER" }
  })

  if (applicationsAsLeader === 0 && currentUser.teamMembers.length === 0) {
    return (
      <div className="p-8 text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-black text-foreground mb-4">Team Dashboard</h1>
        <div className="glass p-8 rounded-2xl border border-border">
          <p className="text-foreground/70 mb-4">You have not applied to any projects as a Team Leader.</p>
        </div>
      </div>
    )
  }

  const teamMembers = currentUser.teamMembers
  const tasks = currentUser.teamTasks

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?team=${userId}`

  const completedTasks = tasks.filter(t => t.status === "APPROVED_BY_QC" || t.status === "APPROVED")
  const pendingTasks = tasks.filter(t => t.status !== "APPROVED_BY_QC" && t.status !== "APPROVED" && t.status !== "AVAILABLE")
  
  const totalWorkedHours = tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 3600
  const validHours = completedTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 3600

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Team Management</h1>
          <p className="text-foreground/70 mt-1">Manage your team members and transcription tasks.</p>
        </div>
        <TeamActions action="downloadReport" payload={userId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-foreground">Team Members</h3>
          </div>
          <p className="text-3xl font-black text-foreground">{teamMembers.length}</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-foreground">Active Tasks</h3>
          </div>
          <p className="text-3xl font-black text-foreground">{pendingTasks.length}</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-green-500" />
            <h3 className="font-bold text-foreground">Valid Hours</h3>
          </div>
          <p className="text-3xl font-black text-foreground">{validHours.toFixed(2)}h <span className="text-sm font-normal text-foreground/50">/ {totalWorkedHours.toFixed(2)}h total</span></p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary" /> Invite Link
        </h2>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            readOnly 
            value={inviteLink} 
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 font-mono text-sm outline-none"
          />
          <TeamActions action="copy" payload={inviteLink} />
        </div>
        <p className="text-xs text-foreground/50 mt-2">Send this link to your team members. They will automatically join your team upon registration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold">Members Directory</h2>
          {teamMembers.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-border rounded-xl text-foreground/50">
              No members joined yet.
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map(member => (
                <div key={member.id} className="p-4 bg-card rounded-xl border border-border">
                  <p className="font-bold">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-foreground/60 font-mono mb-3">{member.email}</p>
                  
                  <TeamActions action="updateRole" memberId={member.id} currentRole={member.teamRole || "TRANSCRIBER"} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Tasks Under Review & In Progress</h2>
          {tasks.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-border rounded-xl text-foreground/50">
              Your team hasn't claimed any tasks yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 font-semibold text-foreground/70">Project</th>
                    <th className="pb-3 font-semibold text-foreground/70">Status</th>
                    <th className="pb-3 font-semibold text-foreground/70">Transcriber</th>
                    <th className="pb-3 font-semibold text-foreground/70">QC</th>
                    <th className="pb-3 font-semibold text-foreground/70 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map(task => (
                    <tr key={task.id} className="group hover:bg-card/50 transition-colors">
                      <td className="py-4 pr-4">
                        <span className="font-semibold block truncate max-w-[150px]">{task.project.title}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-card">
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-foreground/70">
                        {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "—"}
                      </td>
                      <td className="py-4 pr-4 text-foreground/70">
                        {task.qcAssignedTo ? `${task.qcAssignedTo.firstName} ${task.qcAssignedTo.lastName}` : "—"}
                      </td>
                      <td className="py-4 text-right">
                        <TeamActions action="freeTask" taskId={task.id} disabled={task.status === "APPROVED"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
