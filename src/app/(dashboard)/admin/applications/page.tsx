import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { Users, Filter } from "lucide-react"
import { AdminApplicationsClient } from "./AdminApplicationsClient"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, assignedProjects: { select: { id: true } }, canApproveApplications: true, moderatorType: true }
  })

  if (currentUser?.role === "MODERATOR" && !currentUser.canApproveApplications) {
    redirect("/admin")
  }

  const whereClause: any = {
    project: { status: { in: ["OPEN", "IN_PROGRESS"] } }
  }
  if (currentUser?.role === "MODERATOR") {
    const assignedIds = currentUser.assignedProjects?.map(p => p.id) || []
    whereClause.projectId = assignedIds.length > 0 ? { in: assignedIds } : "none"
    
    if (currentUser.moderatorType === "OUTSOURCED") {
      whereClause.user = { teamLeaderId: currentUser.id }
    } else {
      whereClause.user = { teamLeaderId: null }
    }
  }

  const applicationsData = await prisma.application.findMany({
    where: whereClause,
    include: {
      project: { select: { id: true, title: true, pricingModel: true, workflowType: true, sentencesPerUser: true, scriptType: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, gender: true, ranking: true, verificationStatus: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  if (applicationsData.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-foreground">Applications</h1>
        <AdminApplicationsClient applications={[]} />
      </div>
    );
  }

  const projectIds = Array.from(new Set(applicationsData.map(a => a.projectId)));
  const userIds = Array.from(new Set(applicationsData.map(a => a.userId)));

  const sentencesCount = await prisma.projectSentence.groupBy({
    by: ['projectId', 'speakerCode'],
    where: { projectId: { in: projectIds } },
    _count: { _all: true }
  });
  
  const sentencesMap = new Map();
  const projectTotalSentences = new Map();
  const projectBatchSize = new Map();
  
  sentencesCount.forEach(s => {
    sentencesMap.set(`${s.projectId}_${s.speakerCode || 'null'}`, s._count._all);
    const currentTotal = projectTotalSentences.get(s.projectId) || 0;
    projectTotalSentences.set(s.projectId, currentTotal + s._count._all);
    
    // For STATIC projects, the size of one batch (speakerCode group) is the expected total sentences per user
    if (s.speakerCode && !projectBatchSize.has(s.projectId)) {
      projectBatchSize.set(s.projectId, s._count._all);
    }
  });

  const assignedSentencesCount = await prisma.projectSentence.groupBy({
    by: ['projectId', 'assignedUserId'],
    where: { projectId: { in: projectIds }, assignedUserId: { in: userIds, not: null } },
    _count: { _all: true }
  });
  
  const assignedMap = new Map();
  assignedSentencesCount.forEach(s => {
    if (s.assignedUserId) {
      assignedMap.set(`${s.projectId}_${s.assignedUserId}`, s._count._all);
    }
  });

  const recordingsCounts = await prisma.$queryRaw<any[]>`
    SELECT r."userId", s."projectId", r.status, COUNT(r.id)::int as count
    FROM "VoiceRecording" r
    JOIN "ProjectSentence" s ON r."sentenceId" = s.id
    WHERE r."userId" IN (${Prisma.join(userIds)}) AND s."projectId" IN (${Prisma.join(projectIds)})
    GROUP BY r."userId", s."projectId", r.status
  `;

  const recordingsMap = new Map();
  recordingsCounts.forEach(r => {
    const key = `${r.userId}_${r.projectId}`;
    if (!recordingsMap.has(key)) {
      recordingsMap.set(key, { recordedCount: 0, pendingCount: 0, reRecordCount: 0, acceptedCount: 0, rejectedCount: 0 });
    }
    const counts = recordingsMap.get(key);
    
    // Prisma raw count returns a BigInt or Number depending on driver, so we parse it safely
    const amount = Number(r.count);
    if (r.status !== 'NEED_RE_RECORD' && r.status !== 'REJECTED') {
      counts.recordedCount += amount;
    }
    if (r.status === 'PENDING') counts.pendingCount += amount;
    if (r.status === 'NEED_RE_RECORD') counts.reRecordCount += amount;
    if (r.status === 'ACCEPTED') counts.acceptedCount += amount;
    if (r.status === 'REJECTED') counts.rejectedCount += amount;
  });

  const applications = applicationsData.map((app) => {
    const key = `${app.userId}_${app.projectId}`;
    const counts = recordingsMap.get(key) || { recordedCount: 0, pendingCount: 0, reRecordCount: 0, acceptedCount: 0, rejectedCount: 0 };
    
    const recordedCount = counts.recordedCount;
    const pendingCount = counts.pendingCount;
    const reRecordCount = counts.reRecordCount;
    const acceptedCount = counts.acceptedCount;
    const rejectedCount = counts.rejectedCount;

    let totalSentences = 0;
    if (app.speakerCode) {
      totalSentences = sentencesMap.get(`${app.projectId}_${app.speakerCode}`) || 0;
    } else {
      const assignedCount = assignedMap.get(`${app.projectId}_${app.userId}`);
      if (assignedCount && assignedCount > 0) {
        totalSentences = assignedCount;
      } else if (app.project.sentencesPerUser && app.project.sentencesPerUser > 0) {
        totalSentences = app.project.sentencesPerUser;
      } else if (projectBatchSize.has(app.projectId)) {
        totalSentences = projectBatchSize.get(app.projectId);
      } else {
        totalSentences = projectTotalSentences.get(app.projectId) || 0;
      }
    }
    
    let reviewCategory = "WORKING";

    if (app.status === 'FINAL_REVIEW' || app.status === 'APPROVED' || app.status === 'PAID') {
      reviewCategory = "COMPLETED";
    } else if (reRecordCount > 0) {
      reviewCategory = "NEEDS_FIX";
    } else if (pendingCount > 0 && recordedCount >= totalSentences) {
      if (acceptedCount > 0) {
        reviewCategory = "READY_FIXED";
      } else {
        reviewCategory = "READY_FIRST";
      }
    } else if (pendingCount === 0 && recordedCount >= totalSentences && acceptedCount === totalSentences && totalSentences > 0) {
      reviewCategory = "COMPLETED";
    } else {
      reviewCategory = "WORKING";
    }

    return { 
      ...app, 
      recordedCount, 
      totalSentences, 
      isCompleted: recordedCount >= totalSentences, 
      reviewCategory,
      pendingCount,
      reRecordCount,
      acceptedCount,
      rejectedCount,
      projectRole: app.projectRole
    }
  })

  // Sort them so they appear in order of priority when viewing "All"
  applications.sort((a, b) => {
    const priority = {
      "READY_FIXED": 1,
      "READY_FIRST": 2,
      "NEEDS_FIX": 3,
      "WORKING": 4,
      "COMPLETED": 5
    }
    const pA = priority[a.reviewCategory as keyof typeof priority] || 99
    const pB = priority[b.reviewCategory as keyof typeof priority] || 99
    if (pA !== pB) return pA - pB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Project Applications
        </h1>
        <p className="text-foreground/70">Review freelancer applications and manage approvals.</p>
      </div>

      <AdminApplicationsClient applications={applications} />
    </div>
  )
}
