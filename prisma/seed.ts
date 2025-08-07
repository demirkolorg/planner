import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlatılıyor...')

  // Admin kullanıcısı: admin@planner.com
  const hashedPassword = await bcrypt.hash('admin@planner.com', 12)
  
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

  // Normal kullanıcı: user@planner.com
  const userHashedPassword = await bcrypt.hash('user@planner.com', 12)
  
  const normalUser = await prisma.user.upsert({
    where: { email: 'user@planner.com' },
    update: {},
    create: {
      email: 'user@planner.com',
      firstName: 'John',
      lastName: 'Doe',
      password: userHashedPassword,
      role: 'USER',
      emailVerified: true,
    },
  })

  console.log('✅ Normal kullanıcı oluşturuldu:', normalUser.email)
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