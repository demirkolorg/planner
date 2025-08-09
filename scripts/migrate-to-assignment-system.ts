import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateToAssignmentSystem() {
  console.log('🚀 Assignment Sistemi Migration Başladı...')
  
  try {
    // 1. ProjectMember'ları migrate et
    console.log('📋 ProjectMember verilerini Assignment tablosuna taşıyorum...')
    const projectMembers = await prisma.projectMember.findMany({
      include: {
        project: { select: { name: true } }
      }
    })
    
    for (const member of projectMembers) {
      try {
        await prisma.assignment.create({
          data: {
            targetType: 'PROJECT',
            targetId: member.projectId,
            userId: member.userId,
            email: null,
            assignedBy: member.addedBy || member.userId, // Fallback
            status: 'ACTIVE',
            assignedAt: member.addedAt,
            message: `Migrated from ProjectMember`
          }
        })
        console.log(`✅ ProjectMember migrated: ${member.userId} -> ${member.projectId}`)
      } catch (error) {
        console.log(`⚠️  Duplicate ProjectMember skipped: ${member.userId} -> ${member.projectId}`)
      }
    }
    
    // 2. ProjectAssignment'ları migrate et
    console.log('📋 ProjectAssignment verilerini Assignment tablosuna taşıyorum...')
    const projectAssignments = await prisma.projectAssignment.findMany()
    
    for (const assignment of projectAssignments) {
      try {
        await prisma.assignment.create({
          data: {
            targetType: 'PROJECT',
            targetId: assignment.projectId,
            userId: assignment.assigneeId,
            email: null,
            assignedBy: assignment.assignedBy,
            status: 'ACTIVE',
            assignedAt: assignment.assignedAt,
            message: `Migrated from ProjectAssignment`
          }
        })
        console.log(`✅ ProjectAssignment migrated: ${assignment.assigneeId} -> ${assignment.projectId}`)
      } catch (error) {
        console.log(`⚠️  Duplicate ProjectAssignment skipped: ${assignment.assigneeId} -> ${assignment.projectId}`)
      }
    }
    
    // 3. SectionAssignment'ları migrate et
    console.log('📋 SectionAssignment verilerini Assignment tablosuna taşıyorum...')
    const sectionAssignments = await prisma.sectionAssignment.findMany({
      include: {
        section: { select: { name: true } }
      }
    })
    
    for (const assignment of sectionAssignments) {
      try {
        await prisma.assignment.create({
          data: {
            targetType: 'SECTION',
            targetId: assignment.sectionId,
            userId: assignment.assigneeId,
            email: null,
            assignedBy: assignment.assignedBy,
            status: 'ACTIVE',
            assignedAt: assignment.assignedAt,
            message: `Migrated from SectionAssignment`
          }
        })
        console.log(`✅ SectionAssignment migrated: ${assignment.assigneeId} -> ${assignment.sectionId}`)
      } catch (error) {
        console.log(`⚠️  Duplicate SectionAssignment skipped: ${assignment.assigneeId} -> ${assignment.sectionId}`)
      }
    }
    
    // 4. TaskAssignment'ları migrate et
    console.log('📋 TaskAssignment verilerini Assignment tablosuna taşıyorum...')
    const taskAssignments = await prisma.taskAssignment.findMany({
      include: {
        task: { select: { title: true } }
      }
    })
    
    for (const assignment of taskAssignments) {
      try {
        await prisma.assignment.create({
          data: {
            targetType: 'TASK',
            targetId: assignment.taskId,
            userId: assignment.assigneeId,
            email: null,
            assignedBy: assignment.assignedBy,
            status: 'ACTIVE',
            assignedAt: assignment.assignedAt,
            message: `Migrated from TaskAssignment`
          }
        })
        console.log(`✅ TaskAssignment migrated: ${assignment.assigneeId} -> ${assignment.taskId}`)
      } catch (error) {
        console.log(`⚠️  Duplicate TaskAssignment skipped: ${assignment.assigneeId} -> ${assignment.taskId}`)
      }
    }
    
    // 5. EmailAssignment'ları migrate et
    console.log('📋 EmailAssignment verilerini Assignment tablosuna taşıyorum...')
    const emailAssignments = await prisma.emailAssignment.findMany()
    
    for (const assignment of emailAssignments) {
      try {
        await prisma.assignment.create({
          data: {
            targetType: assignment.targetType,
            targetId: assignment.targetId,
            userId: null, // Email assignment
            email: assignment.email,
            assignedBy: assignment.assignedBy,
            status: assignment.status,
            assignedAt: assignment.assignedAt,
            expiresAt: assignment.expiresAt,
            acceptedAt: assignment.acceptedAt,
            message: assignment.message || 'Migrated from EmailAssignment'
          }
        })
        console.log(`✅ EmailAssignment migrated: ${assignment.email} -> ${assignment.targetType}:${assignment.targetId}`)
      } catch (error) {
        console.log(`⚠️  Duplicate EmailAssignment skipped: ${assignment.email} -> ${assignment.targetType}:${assignment.targetId}`)
      }
    }
    
    // 6. İstatistikleri göster
    const totalAssignments = await prisma.assignment.count()
    const activeAssignments = await prisma.assignment.count({ where: { status: 'ACTIVE' } })
    const pendingAssignments = await prisma.assignment.count({ where: { status: 'PENDING' } })
    const projectAssignmentCount = await prisma.assignment.count({ where: { targetType: 'PROJECT' } })
    const sectionAssignmentCount = await prisma.assignment.count({ where: { targetType: 'SECTION' } })
    const taskAssignmentCount = await prisma.assignment.count({ where: { targetType: 'TASK' } })
    
    console.log('\n📊 Migration İstatistikleri:')
    console.log(`✅ Toplam Assignment: ${totalAssignments}`)
    console.log(`🟢 Aktif: ${activeAssignments}`)
    console.log(`🟡 Bekleyen: ${pendingAssignments}`)
    console.log(`📁 Proje: ${projectAssignmentCount}`)
    console.log(`📂 Bölüm: ${sectionAssignmentCount}`)
    console.log(`📝 Görev: ${taskAssignmentCount}`)
    
    console.log('\n🎉 Assignment Sistemi Migration Başarıyla Tamamlandı!')
    
  } catch (error) {
    console.error('❌ Migration Hatası:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Script çalıştır
migrateToAssignmentSystem()