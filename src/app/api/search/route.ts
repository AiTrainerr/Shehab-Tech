import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const user = await getCurrentUser()
    const isRealAdmin = !!(user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN"))

    const results: any[] = []

    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
        status: { not: "CANCELLED" },
      },
      select: { id: true, title: true, status: true, pricingModel: true },
      take: 5,
    })

    projects.forEach(p => {
      results.push({
        type: "project",
        id: p.id,
        title: p.title,
        subtitle: `${p.status} · ${p.pricingModel || ""}`,
        href: isRealAdmin ? `/admin/projects` : `/member/projects/${p.id}`,
      })
    })

    // Admin-only: search users (requires server-verified ADMIN / SUPER_ADMIN)
    if (isRealAdmin) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        take: 5,
      })

      users.forEach(u => {
        results.push({
          type: "user",
          id: u.id,
          title: `${u.firstName} ${u.lastName}`,
          subtitle: `${u.email} · ${u.role}`,
          href: `/admin/users`,
        })
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ results: [] })
  }
}
