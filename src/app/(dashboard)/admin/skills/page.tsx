import { prisma } from "@/lib/prisma"
import { AdminSkillsClient } from "./AdminSkillsClient"

export default async function AdminSkillsPage() {
  const resources = await prisma.learningResource.findMany({
    orderBy: { createdAt: "desc" }
  })

  return <AdminSkillsClient resources={resources} />
}
