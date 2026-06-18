import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"
import EditProfileForm from "./EditProfileForm"

export default async function EditProfilePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      phone: true,
      whatsapp: true,
      bio: true,
      projectTypes: true,
      languages: true,
    }
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto w-full">
        <Link href="/member/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <User className="w-8 h-8 text-primary" /> Edit Profile
        </h1>
        <p className="text-foreground/70 mb-8">Update your personal information including email and phone.</p>

        <EditProfileForm user={user} />
      </div>
    </div>
  )
}
