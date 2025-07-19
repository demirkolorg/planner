import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlatılıyor...')

  // Demo kullanıcı oluştur
  const hashedPassword = await bcrypt.hash('demo123', 12)
  const hashedPassword2 = await bcrypt.hash('demirkol@planner.com', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'Kullanıcı',
      password: hashedPassword,
    },
  })
  const otherUser = await prisma.user.upsert({
    where: { email: 'demirkol@planner.com' },
    update: {},
    create: {
      email: 'demirkol@planner.com',
      firstName: 'Abdullah',
      lastName: 'Demirkol',
      password: hashedPassword2,
    },
  })
  console.log('✅ Demo kullanıcı oluşturuldu:', demoUser.email)

  // Demo kullanıcı için etiketler oluştur
  const tagData = [
    { name: 'Acil', color: '#ef4444' },
    { name: 'İş', color: '#3b82f6' },
    { name: 'Kişisel', color: '#10b981' },
    { name: 'Alışveriş', color: '#f59e0b' },
    { name: 'Sağlık', color: '#8b5cf6' }
  ]

  const demoTags = []
  for (const tagInfo of tagData) {
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: tagInfo.name,
        userId: demoUser.id
      }
    })

    if (existingTag) {
      console.log(`⚠️ Etiket zaten mevcut: ${tagInfo.name} (demo kullanıcı)`)
      demoTags.push(existingTag)
    } else {
      const tag = await prisma.tag.create({
        data: {
          name: tagInfo.name,
          color: tagInfo.color,
          userId: demoUser.id
        }
      })
      console.log(`✅ Etiket oluşturuldu: ${tagInfo.name} (demo kullanıcı)`)
      demoTags.push(tag)
    }
  }

  // Diğer kullanıcı için etiketler oluştur
  const otherTags = []
  for (const tagInfo of tagData) {
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: tagInfo.name,
        userId: otherUser.id
      }
    })

    if (existingTag) {
      console.log(`⚠️ Etiket zaten mevcut: ${tagInfo.name} (other kullanıcı)`)
      otherTags.push(existingTag)
    } else {
      const tag = await prisma.tag.create({
        data: {
          name: tagInfo.name,
          color: tagInfo.color,
          userId: otherUser.id
        }
      })
      console.log(`✅ Etiket oluşturuldu: ${tagInfo.name} (other kullanıcı)`)
      otherTags.push(tag)
    }
  }

  const tags = demoTags // Görevlerde demo kullanıcının tag'larını kullanacağız
  console.log('✅ Toplam etiket oluşturuldu:', demoTags.length + otherTags.length)

  // Demo kullanıcı için projeler oluştur  
  const projectData = [
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
    },
    {
      name: 'Kitap Okuma',
      emoji: '📚',
      notes: '2024 yılı okuma hedefleri'
    }
  ]

  const demoProjects = []
  for (const projectInfo of projectData) {
    // Proje zaten var mı kontrol et
    const existingProject = await prisma.project.findFirst({
      where: {
        name: projectInfo.name,
        userId: demoUser.id,
      }
    })

    let project
    if (existingProject) {
      console.log(`⚠️ Proje zaten mevcut: ${projectInfo.name} (demo kullanıcı)`)
      project = existingProject
    } else {
      project = await prisma.project.create({
        data: {
          ...projectInfo,
          userId: demoUser.id,
        }
      })
      console.log(`✅ Proje oluşturuldu: ${project.name} (demo kullanıcı)`)
    }

    demoProjects.push(project)

    // Her proje için varsayılan "Genel" bölümü oluştur (eğer yoksa)
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
      console.log(`✅ Genel bölümü oluşturuldu: ${project.name} (demo kullanıcı)`)
    } else {
      console.log(`⚠️ Genel bölümü zaten mevcut: ${project.name} (demo kullanıcı)`)
    }
  }

  // Diğer kullanıcı için basit projeler oluştur
  const otherProjects = []
  const simpleProjectData = [
    { name: 'Gelen Kutusu', emoji: '📥', notes: 'İkinci kullanıcının gelen kutusu' },
    { name: 'Kişisel Projeler', emoji: '👤', notes: 'Kişisel işler ve hobiler' }
  ]

  for (const projectInfo of simpleProjectData) {
    const existingProject = await prisma.project.findFirst({
      where: {
        name: projectInfo.name,
        userId: otherUser.id,
      }
    })

    let project
    if (existingProject) {
      console.log(`⚠️ Proje zaten mevcut: ${projectInfo.name} (other kullanıcı)`)
      project = existingProject
    } else {
      project = await prisma.project.create({
        data: {
          ...projectInfo,
          userId: otherUser.id,
        }
      })
      console.log(`✅ Proje oluşturuldu: ${project.name} (other kullanıcı)`)
    }

    otherProjects.push(project)

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
      console.log(`✅ Genel bölümü oluşturuldu: ${project.name} (other kullanıcı)`)
    }
  }

  const createdProjects = demoProjects // Task'larda demo kullanıcının projelerini kullanacağız

  // Örnek görevler oluştur
  const [gelenKutusu, evIsleri, webSitesi, fitness, kitap] = createdProjects

  // Gelen kutusu bölümünü al
  const gelenKutusuSection = await prisma.section.findFirst({
    where: { projectId: gelenKutusu.id }
  })

  const evIsleriSection = await prisma.section.findFirst({
    where: { projectId: evIsleri.id }
  })

  const webSitesiSection = await prisma.section.findFirst({
    where: { projectId: webSitesi.id }
  })

  // Web sitesi projesi için ek bölümler
  await prisma.section.createMany({
    data: [
      { name: 'Tasarım', projectId: webSitesi.id, order: 1 },
      { name: 'Geliştirme', projectId: webSitesi.id, order: 2 },
      { name: 'Test', projectId: webSitesi.id, order: 3 },
    ]
  })

  const tasarimSection = await prisma.section.findFirst({
    where: { projectId: webSitesi.id, name: 'Tasarım' }
  })

  const gelistirmeSection = await prisma.section.findFirst({
    where: { projectId: webSitesi.id, name: 'Geliştirme' }
  })

  // Örnek görevler
  const tasks = [
    // Gelen Kutusu
    {
      title: 'E-posta kutusunu temizle',
      description: 'Gereksiz e-postaları sil ve önemli olanları klasörle',
      priority: 'MEDIUM',
      projectId: gelenKutusu.id,
      sectionId: gelenKutusuSection?.id,
      tagId: tags[1].id, // İş
    },
    {
      title: 'Pazartesi toplantısına hazırlan',
      description: 'Sunum materyallerini gözden geçir',
      priority: 'HIGH',
      projectId: gelenKutusu.id,
      sectionId: gelenKutusuSection?.id,
      tagId: tags[0].id, // Acil
    },
    
    // Ev İşleri
    {
      title: 'Bulaşık makinasını çalıştır',
      description: null,
      priority: 'LOW',
      projectId: evIsleri.id,
      sectionId: evIsleriSection?.id,
      tagId: tags[2].id, // Kişisel
      completed: true,
    },
    {
      title: 'Haftalık market alışverişi',
      description: 'Süt, ekmek, meyve, sebze',
      priority: 'MEDIUM',
      projectId: evIsleri.id,
      sectionId: evIsleriSection?.id,
      tagId: tags[3].id, // Alışveriş
    },
    {
      title: 'Oturma odasını temizle',
      description: 'Elektrikli süpürge ve silme',
      priority: 'LOW',
      projectId: evIsleri.id,
      sectionId: evIsleriSection?.id,
      tagId: tags[2].id, // Kişisel
    },

    // Web Sitesi Projesi
    {
      title: 'Ana sayfa mockup tasarımı',
      description: 'Figma\'da ana sayfa wireframe ve mockup oluştur',
      priority: 'HIGH',
      projectId: webSitesi.id,
      sectionId: tasarimSection?.id,
      tagId: tags[1].id, // İş
    },
    {
      title: 'Renk paleti belirleme',
      description: 'Marka kimliğine uygun renk paleti seç',
      priority: 'MEDIUM',
      projectId: webSitesi.id,
      sectionId: tasarimSection?.id,
      tagId: tags[1].id, // İş
      completed: true,
    },
    {
      title: 'React projesi kurulumu',
      description: 'Next.js ve Tailwind CSS ile proje başlat',
      priority: 'HIGH',
      projectId: webSitesi.id,
      sectionId: gelistirmeSection?.id,
      tagId: tags[1].id, // İş
    },

    // Fitness
    {
      title: 'Pazartesi: Üst vücut antrenmanı',
      description: '45 dakika ağırlık antrenmanı',
      priority: 'MEDIUM',
      projectId: fitness.id,
      sectionId: await prisma.section.findFirst({ where: { projectId: fitness.id } }).then(s => s?.id),
      tagId: tags[4].id, // Sağlık
    },
    {
      title: 'Haftalık kilo takibi',
      description: 'Pazartesi sabahı tartı',
      priority: 'LOW',
      projectId: fitness.id,
      sectionId: await prisma.section.findFirst({ where: { projectId: fitness.id } }).then(s => s?.id),
      tagId: tags[4].id, // Sağlık
    },

    // Kitap Okuma
    {
      title: 'Atomic Habits - Bölüm 3',
      description: 'Habit stacking konusunu oku',
      priority: 'LOW',
      projectId: kitap.id,
      sectionId: await prisma.section.findFirst({ where: { projectId: kitap.id } }).then(s => s?.id),
      tagId: tags[2].id, // Kişisel
    },
  ]

  let createdTasksCount = 0
  for (const taskData of tasks) {
    // Görev zaten var mı kontrol et
    const existingTask = await prisma.task.findFirst({
      where: {
        title: taskData.title,
        projectId: taskData.projectId,
        userId: demoUser.id,
      }
    })

    if (existingTask) {
      console.log(`⚠️ Görev zaten mevcut: ${taskData.title}`)
    } else {
      await prisma.task.create({
        data: {
          ...taskData,
          userId: demoUser.id,
        }
      })
      createdTasksCount++
      console.log(`✅ Görev oluşturuldu: ${taskData.title}`)
    }
  }

  console.log(`✅ ${createdTasksCount} yeni görev oluşturuldu`)
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