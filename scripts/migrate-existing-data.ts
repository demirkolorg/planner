import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateTaskTags() {
  console.log('🔄 Mevcut task-tag verilerini migrate ediliyor...')

  // Mevcut tagId olan task'ları bul
  const tasksWithTags = await prisma.task.findMany({
    where: {
      tagId: {
        not: null
      }
    },
    select: {
      id: true,
      tagId: true
    }
  })

  console.log(`📊 ${tasksWithTags.length} task-tag ilişkisi bulundu`)

  // Her task-tag ilişkisini TaskTag tablosuna ekle
  for (const task of tasksWithTags) {
    if (task.tagId) {
      try {
        await prisma.taskTag.create({
          data: {
            taskId: task.id,
            tagId: task.tagId
          }
        })
        console.log(`✅ Task ${task.id} - Tag ${task.tagId} migrate edildi`)
      } catch (error) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          console.log(`⚠️ Task ${task.id} - Tag ${task.tagId} zaten mevcut, atlanıyor`)
        } else {
          console.error(`❌ Task ${task.id} migrate edilemedi:`, error)
        }
      }
    }
  }

  console.log('✅ Migration tamamlandı!')
}

migrateTaskTags()
  .then(async () => {
    await prisma.$disconnect()
    console.log('📦 Database bağlantısı kapatıldı')
  })
  .catch(async (e) => {
    console.error('❌ Migration hatası:', e)
    await prisma.$disconnect()
    process.exit(1)
  })