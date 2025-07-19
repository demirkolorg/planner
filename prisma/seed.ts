import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlatılıyor...')

  // Kullanıcı 1: abdullah@planner.com
  const hashedPassword1 = await bcrypt.hash('abdullah@planner.com', 12)
  
  const user1 = await prisma.user.upsert({
    where: { email: 'abdullah@planner.com' },
    update: {},
    create: {
      email: 'abdullah@planner.com',
      firstName: 'Abdullah',
      lastName: 'Kullanıcı',
      password: hashedPassword1,
    },
  })

  // Kullanıcı 2: demirkol@planner.com
  const hashedPassword2 = await bcrypt.hash('demirkol@planner.com', 12)
  
  const user2 = await prisma.user.upsert({
    where: { email: 'demirkol@planner.com' },
    update: {},
    create: {
      email: 'demirkol@planner.com',
      firstName: 'Demirkol',
      lastName: 'Kullanıcı',
      password: hashedPassword2,
    },
  })
  console.log('✅ Kullanıcılar oluşturuldu:', user1.email, user2.email)

  // Kullanıcı 1 için etiketler oluştur
  const tagData = [
    { name: 'Acil', color: '#ef4444' },
    { name: 'İş', color: '#3b82f6' },
    { name: 'Kişisel', color: '#10b981' },
    { name: 'Alışveriş', color: '#f59e0b' },
    { name: 'Sağlık', color: '#8b5cf6' }
  ]

  const user1Tags = []
  for (const tagInfo of tagData) {
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: tagInfo.name,
        userId: user1.id
      }
    })

    if (existingTag) {
      console.log(`⚠️ Etiket zaten mevcut: ${tagInfo.name} (kullanıcı 1)`)
      user1Tags.push(existingTag)
    } else {
      const tag = await prisma.tag.create({
        data: {
          name: tagInfo.name,
          color: tagInfo.color,
          userId: user1.id
        }
      })
      console.log(`✅ Etiket oluşturuldu: ${tagInfo.name} (kullanıcı 1)`)
      user1Tags.push(tag)
    }
  }

  // Kullanıcı 2 için etiketler oluştur
  const user2Tags = []
  for (const tagInfo of tagData) {
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: tagInfo.name,
        userId: user2.id
      }
    })

    if (existingTag) {
      console.log(`⚠️ Etiket zaten mevcut: ${tagInfo.name} (kullanıcı 2)`)
      user2Tags.push(existingTag)
    } else {
      const tag = await prisma.tag.create({
        data: {
          name: tagInfo.name,
          color: tagInfo.color,
          userId: user2.id
        }
      })
      console.log(`✅ Etiket oluşturuldu: ${tagInfo.name} (kullanıcı 2)`)
      user2Tags.push(tag)
    }
  }

  console.log('✅ Toplam etiket oluşturuldu:', user1Tags.length + user2Tags.length)

  // Kullanıcı 1 için projeler oluştur  
  const user1ProjectData = [
    {
      name: 'Gelen Kutusu',
      emoji: '📥',
      notes: 'Tüm yeni görevler burada toplanır'
    },
    {
      name: 'Ev İşleri',
      emoji: '🏠',
      notes: 'Ev temizliği ve düzenleme görevleri'
    },
    {
      name: 'Web Sitesi Projesi',
      emoji: '💻',
      notes: 'Yeni kurumsal web sitesi geliştirme projesi'
    },
    {
      name: 'Fitness Programı',
      emoji: '🏋️',
      notes: 'Günlük egzersiz ve beslenme takibi'
    }
  ]

  const user1Projects = []
  for (const projectInfo of user1ProjectData) {
    const existingProject = await prisma.project.findFirst({
      where: {
        name: projectInfo.name,
        userId: user1.id,
      }
    })

    let project
    if (existingProject) {
      console.log(`⚠️ Proje zaten mevcut: ${projectInfo.name} (kullanıcı 1)`)
      project = existingProject
    } else {
      project = await prisma.project.create({
        data: {
          ...projectInfo,
          userId: user1.id,
        }
      })
      console.log(`✅ Proje oluşturuldu: ${project.name} (kullanıcı 1)`)
    }

    user1Projects.push(project)

    // Her proje için varsayılan "Genel" bölümü oluştur
    const existingSection = await prisma.section.findFirst({
      where: {
        name: 'Genel',
        projectId: project.id,
      }
    })

    if (!existingSection) {
      await prisma.section.create({
        data: {
          name: 'Genel',
          projectId: project.id,
          order: 0,
        }
      })
      console.log(`✅ Genel bölümü oluşturuldu: ${project.name} (kullanıcı 1)`)
    } else {
      console.log(`⚠️ Genel bölümü zaten mevcut: ${project.name} (kullanıcı 1)`)
    }
  }

  // Kullanıcı 2 için projeler oluştur
  const user2ProjectData = [
    { name: 'Gelen Kutusu', emoji: '📥', notes: 'İkinci kullanıcının gelen kutusu' },
    { name: 'Kişisel Projeler', emoji: '👤', notes: 'Kişisel işler ve hobiler' },
    { name: 'Yazılım Geliştirme', emoji: '⚡', notes: 'Kodlama ve yazılım projeleri' }
  ]

  const user2Projects = []
  for (const projectInfo of user2ProjectData) {
    const existingProject = await prisma.project.findFirst({
      where: {
        name: projectInfo.name,
        userId: user2.id,
      }
    })

    let project
    if (existingProject) {
      console.log(`⚠️ Proje zaten mevcut: ${projectInfo.name} (kullanıcı 2)`)
      project = existingProject
    } else {
      project = await prisma.project.create({
        data: {
          ...projectInfo,
          userId: user2.id,
        }
      })
      console.log(`✅ Proje oluşturuldu: ${project.name} (kullanıcı 2)`)
    }

    user2Projects.push(project)

    // Genel bölümü oluştur
    const existingSection = await prisma.section.findFirst({
      where: {
        name: 'Genel',
        projectId: project.id,
      }
    })

    if (!existingSection) {
      await prisma.section.create({
        data: {
          name: 'Genel',
          projectId: project.id,
          order: 0,
        }
      })
      console.log(`✅ Genel bölümü oluşturuldu: ${project.name} (kullanıcı 2)`)
    }
  }

  // Kullanıcı 1 için görevler oluştur
  const [user1GelenKutusu, user1EvIsleri, user1WebSitesi, user1Fitness] = user1Projects

  // Web sitesi projesi için ek bölümler (kullanıcı 1)
  await prisma.section.createMany({
    data: [
      { name: 'Tasarım', projectId: user1WebSitesi.id, order: 1 },
      { name: 'Geliştirme', projectId: user1WebSitesi.id, order: 2 },
      { name: 'Test', projectId: user1WebSitesi.id, order: 3 },
    ],
    skipDuplicates: true
  })

  // Kullanıcı 2 için ek bölümler
  const [user2GelenKutusu, user2Kisisel, user2Yazilim] = user2Projects
  
  await prisma.section.createMany({
    data: [
      { name: 'Frontend', projectId: user2Yazilim.id, order: 1 },
      { name: 'Backend', projectId: user2Yazilim.id, order: 2 },
    ],
    skipDuplicates: true
  })

  // Kullanıcı 1 için görevler
  const user1Tasks = [
    // Gelen Kutusu
    {
      title: 'E-posta kutusunu temizle',
      description: 'Gereksiz e-postaları sil ve önemli olanları klasörle',
      priority: 'MEDIUM',
      projectId: user1GelenKutusu.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user1GelenKutusu.id, name: 'Genel' } }))?.id,
      tagId: user1Tags[1].id, // İş
    },
    {
      title: 'Pazartesi toplantısına hazırlan',
      description: 'Sunum materyallerini gözden geçir',
      priority: 'HIGH',
      projectId: user1GelenKutusu.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user1GelenKutusu.id, name: 'Genel' } }))?.id,
      tagId: user1Tags[0].id, // Acil
    },
    
    // Ev İşleri
    {
      title: 'Bulaşık makinasını çalıştır',
      description: null,
      priority: 'LOW',
      projectId: user1EvIsleri.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user1EvIsleri.id, name: 'Genel' } }))?.id,
      tagId: user1Tags[2].id, // Kişisel
      completed: true,
    },
    {
      title: 'Haftalık market alışverişi',
      description: 'Süt, ekmek, meyve, sebze',
      priority: 'MEDIUM',
      projectId: user1EvIsleri.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user1EvIsleri.id, name: 'Genel' } }))?.id,
      tagId: user1Tags[3].id, // Alışveriş
    },

    // Web Sitesi
    {
      title: 'Ana sayfa mockup tasarımı',
      description: 'Figma\'da ana sayfa wireframe ve mockup oluştur',
      priority: 'HIGH',
      projectId: user1WebSitesi.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user1WebSitesi.id, name: 'Tasarım' } }))?.id,
      tagId: user1Tags[1].id, // İş
    },
    {
      title: 'React projesi kurulumu',
      description: 'Next.js ve Tailwind CSS ile proje başlat',
      priority: 'HIGH',
      projectId: user1WebSitesi.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user1WebSitesi.id, name: 'Geliştirme' } }))?.id,
      tagId: user1Tags[1].id, // İş
    },

    // Fitness
    {
      title: 'Pazartesi: Üst vücut antrenmanı',
      description: '45 dakika ağırlık antrenmanı',
      priority: 'MEDIUM',
      projectId: user1Fitness.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user1Fitness.id, name: 'Genel' } }))?.id,
      tagId: user1Tags[4].id, // Sağlık
    },
  ]

  // Kullanıcı 2 için görevler
  const user2Tasks = [
    // Gelen Kutusu
    {
      title: 'Portfolio sitesini güncelle',
      description: 'Yeni projeleri ekle ve CV\'yi güncelle',
      priority: 'HIGH',
      projectId: user2GelenKutusu.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user2GelenKutusu.id, name: 'Genel' } }))?.id,
      tagId: user2Tags[1].id, // İş
    },
    {
      title: 'Doktor randevusu al',
      description: 'Yıllık check-up için randevu',
      priority: 'MEDIUM',
      projectId: user2Kisisel.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user2Kisisel.id, name: 'Genel' } }))?.id,
      tagId: user2Tags[4].id, // Sağlık
    },

    // Yazılım Geliştirme
    {
      title: 'React Native uygulama başlat',
      description: 'Expo ile mobil uygulama geliştirme',
      priority: 'HIGH',
      projectId: user2Yazilim.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user2Yazilim.id, name: 'Frontend' } }))?.id,
      tagId: user2Tags[1].id, // İş
    },
    {
      title: 'API endpoints tasarla',
      description: 'REST API yapısını belirle',
      priority: 'MEDIUM',
      projectId: user2Yazilim.id,
      sectionId: (await prisma.section.findFirst({ where: { projectId: user2Yazilim.id, name: 'Backend' } }))?.id,
      tagId: user2Tags[1].id, // İş
      completed: true,
    },
  ]

  // Kullanıcı 1 görevlerini oluştur
  let user1TasksCount = 0
  for (const taskData of user1Tasks) {
    const existingTask = await prisma.task.findFirst({
      where: {
        title: taskData.title,
        projectId: taskData.projectId,
        userId: user1.id,
      }
    })

    if (existingTask) {
      console.log(`⚠️ Görev zaten mevcut: ${taskData.title} (kullanıcı 1)`)
    } else {
      // Task oluştur
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          projectId: taskData.projectId,
          sectionId: taskData.sectionId,
          userId: user1.id,
          completed: taskData.completed || false
        }
      })

      // Tag ilişkisi oluştur (eğer task'ın tagId'si varsa)
      if (taskData.tagId) {
        await prisma.taskTag.create({
          data: {
            taskId: task.id,
            tagId: taskData.tagId
          }
        })
      }

      user1TasksCount++
      console.log(`✅ Görev oluşturuldu: ${taskData.title} (kullanıcı 1)`)
    }
  }

  // Kullanıcı 2 görevlerini oluştur
  let user2TasksCount = 0
  for (const taskData of user2Tasks) {
    const existingTask = await prisma.task.findFirst({
      where: {
        title: taskData.title,
        projectId: taskData.projectId,
        userId: user2.id,
      }
    })

    if (existingTask) {
      console.log(`⚠️ Görev zaten mevcut: ${taskData.title} (kullanıcı 2)`)
    } else {
      // Task oluştur
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          projectId: taskData.projectId,
          sectionId: taskData.sectionId,
          userId: user2.id,
          completed: taskData.completed || false
        }
      })

      // Tag ilişkisi oluştur (eğer task'ın tagId'si varsa)
      if (taskData.tagId) {
        await prisma.taskTag.create({
          data: {
            taskId: task.id,
            tagId: taskData.tagId
          }
        })
      }

      user2TasksCount++
      console.log(`✅ Görev oluşturuldu: ${taskData.title} (kullanıcı 2)`)
    }
  }

  console.log(`✅ Toplam ${user1TasksCount + user2TasksCount} yeni görev oluşturuldu`)
  console.log('🎉 Seed işlemi tamamlandı!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed işlemi başarısız:', e)
    await prisma.$disconnect()
    process.exit(1)
  })