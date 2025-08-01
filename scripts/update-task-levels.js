// Mevcut task'ların level'larını hesaplayan migration script'i
const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function updateTaskLevels() {
  console.log('🔄 Task levellarini guncelleme basladi...')
  
  try {
    // Tum tasklari al
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        parentTaskId: true,
        title: true
      }
    })
    
    console.log(`📊 Toplam ${tasks.length} task bulundu`)
    
    // Task map oluştur
    const taskMap = new Map()
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, level: 0 })
    })
    
    // Level hesaplama fonksiyonu
    function calculateLevel(taskId, visited = new Set()) {
      if (visited.has(taskId)) {
        console.warn(`Circular reference tespit edildi: ${taskId}`)
        return 0
      }
      
      const task = taskMap.get(taskId)
      if (!task) return 0
      
      if (!task.parentTaskId) {
        return 0 // Root task
      }
      
      visited.add(taskId)
      const parentLevel = calculateLevel(task.parentTaskId, visited)
      visited.delete(taskId)
      
      return Math.min(parentLevel + 1, 10) // Max 10 level
    }
    
    // Her task icin level hesapla
    const updates = []
    for (const task of tasks) {
      const level = calculateLevel(task.id)
      if (level !== task.level) {
        updates.push({
          id: task.id,
          level: level,
          title: task.title.substring(0, 30)
        })
      }
    }
    
    console.log(`🔧 ${updates.length} taskin leveli guncellenecek`)
    
    // Batch update yap
    let updatedCount = 0
    for (const update of updates) {
      await prisma.task.update({
        where: { id: update.id },
        data: { level: update.level }
      })
      updatedCount++
      
      if (updatedCount % 10 === 0) {
        console.log(`📈 ${updatedCount}/${updates.length} task guncellendi`)
      }
    }
    
    console.log('✅ Task level guncellemesi tamamlandi!')
    
    // Ozet rapor
    const levelCounts = await prisma.task.groupBy({
      by: ['level'],
      _count: true
    })
    
    console.log('\n📊 Level Dagilimi:')
    levelCounts.forEach(({ level, _count }) => {
      console.log(`  Level ${level}: ${_count} task`)
    })
    
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Scripti calistir
updateTaskLevels()