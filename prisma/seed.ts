import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlatılıyor...')

  // Admin kullanıcısı: admin@planner.com
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@planner.com' },
    update: {},
    create: {
      email: 'admin@planner.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  console.log('✅ Admin kullanıcısı oluşturuldu:', adminUser.email)
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