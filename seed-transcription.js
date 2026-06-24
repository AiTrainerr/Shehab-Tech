const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("Seeding mock transcription task...")

  // Find a user to assign the task to (preferably the current admin/user)
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' } // just get the first user
  })

  if (!user) {
    console.error("No users found in the database. Please create a user first.")
    return
  }

  // Create a dummy project
  const project = await prisma.project.create({
    data: {
      title: "مشروع تفريغ تجريبي (Mock)",
      description: "هذا مشروع تم إنشاؤه تلقائياً لتجربة محرر التفريغ الصوتي.",
      isTranscriptionProject: true,
      outputFormat: "WORD",
      durationUnit: "HOUR",
      pricingModel: "FIXED_PROJECT",
      status: "OPEN"
    }
  })

  // Create a transcription task
  // Using a public sample audio file URL for testing
  const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

  const task = await prisma.transcriptionTask.create({
    data: {
      projectId: project.id,
      audioFilePath: sampleAudioUrl,
      duration: 372, // ~6 mins
      speakerCount: 2,
      status: "ASSIGNED",
      assignedToId: user.id
    }
  })

  // Create some initial segments
  await prisma.transcriptionSegment.createMany({
    data: [
      {
        taskId: task.id,
        startTime: 0,
        endTime: 5.5,
        speakerLabel: "Speaker 1",
        transcriptText: "أهلاً بك في منصة التفريغ الصوتي التجريبية."
      },
      {
        taskId: task.id,
        startTime: 6.0,
        endTime: 12.0,
        speakerLabel: "Speaker 2",
        transcriptText: "هذا المقطع معد مسبقاً لتجربة المحرر."
      }
    ]
  })

  console.log(`\n✅ Mock Data Created Successfully!`)
  console.log(`- Project ID: ${project.id}`)
  console.log(`- Task ID: ${task.id}`)
  console.log(`- Assigned to User: ${user.firstName} ${user.lastName} (${user.email})`)
  console.log(`\n🔗 Test URLs:`)
  console.log(`Freelancer Editor: http://localhost:3000/member/transcription/${task.id}`)
  console.log(`Admin QA: http://localhost:3000/admin/transcription/qa/${task.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
