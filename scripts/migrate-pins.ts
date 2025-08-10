import { db } from '../src/lib/db'

async function migratePinsToUserPin() {
  console.log('🔄 Pin verilerini UserPin tablosuna geçirme başlıyor...')

  try {
    // Project pinlerini migrate et
    const pinnedProjects = await db.project.findMany({
      where: { isPinned: true },
      select: { id: true, userId: true, name: true }
    })

    console.log(`📌 ${pinnedProjects.length} pinlenmiş proje bulundu`)

    for (const project of pinnedProjects) {
      await db.userPin.upsert({
        where: {
          userId_targetType_targetId: {
            userId: project.userId,
            targetType: 'PROJECT',
            targetId: project.id
          }
        },
        update: {},
        create: {
          userId: project.userId,
          targetType: 'PROJECT',
          targetId: project.id
        }
      })
      console.log(`✅ Proje pin oluşturuldu: ${project.name}`)
    }

    // Task pinlerini migrate et  
    const pinnedTasks = await db.task.findMany({
      where: { isPinned: true },
      select: { id: true, userId: true, title: true }
    })

    console.log(`📌 ${pinnedTasks.length} pinlenmiş görev bulundu`)

    for (const task of pinnedTasks) {
      await db.userPin.upsert({
        where: {
          userId_targetType_targetId: {
            userId: task.userId,
            targetType: 'TASK',
            targetId: task.id
          }
        },
        update: {},
        create: {
          userId: task.userId,
          targetType: 'TASK',
          targetId: task.id
        }
      })
      console.log(`✅ Görev pin oluşturuldu: ${task.title}`)
    }

    console.log('🎉 Pin migration tamamlandı!')
    console.log(`📊 Toplamda ${pinnedProjects.length} proje ve ${pinnedTasks.length} görev pin'i migrate edildi`)

  } catch (error) {
    console.error('❌ Migration hatası:', error)
    throw error
  }
}

// Script çalıştır
migratePinsToUserPin()
  .then(() => {
    console.log('✨ Migration başarılı!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration başarısız:', error)
    process.exit(1)
  })