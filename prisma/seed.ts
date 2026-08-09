import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Configuration — change these values before first deployment
// ---------------------------------------------------------------------------
const SUPER_ADMIN_EMAIL = 'admin@qrdinex.com'
const SUPER_ADMIN_NAME = 'QRDineX Admin'
const SUPER_ADMIN_PHONE = '+0000000000' // Update before going live
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'QRDineX@Admin2026!'

// ---------------------------------------------------------------------------
// Bcrypt cost factor — 12 is the production-safe minimum.
// Higher values increase security but slow down the seed script.
// ---------------------------------------------------------------------------
const BCRYPT_COST_FACTOR = 12

async function main(): Promise<void> {
  console.log('🌱 Starting QRDineX database seed...\n')

  // ---------------------------------------------------------------------------
  // Check if the Super Admin already exists
  // ---------------------------------------------------------------------------
  const existingAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true, email: true },
  })

  if (existingAdmin) {
    console.log(
      `✅ Super Admin already exists: ${existingAdmin.email} (id: ${existingAdmin.id})`
    )
    console.log(
      '   ℹ️  Password was NOT changed. Use the admin panel to update it.\n'
    )
    return
  }

  // ---------------------------------------------------------------------------
  // Hash the password with bcrypt
  // ---------------------------------------------------------------------------
  console.log(`🔐 Hashing password (bcrypt cost: ${BCRYPT_COST_FACTOR})...`)
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_COST_FACTOR)

  // ---------------------------------------------------------------------------
  // Create the Super Admin user
  // ---------------------------------------------------------------------------
  const superAdmin = await prisma.user.create({
    data: {
      fullName: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      phoneNumber: SUPER_ADMIN_PHONE,
      role: UserRole.SUPER_ADMIN,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  })

  console.log('\n✅ Super Admin seeded successfully!')
  console.log('─'.repeat(50))
  console.log(`   ID        : ${superAdmin.id}`)
  console.log(`   Name      : ${superAdmin.fullName}`)
  console.log(`   Email     : ${superAdmin.email}`)
  console.log(`   Role      : ${superAdmin.role}`)
  console.log(`   Created   : ${superAdmin.createdAt.toISOString()}`)
  console.log('─'.repeat(50))
  console.log('\n⚠️  IMPORTANT:')
  console.log(
    '   Change the default password immediately after first login!'
  )
  console.log(
    '   Default password is set via SEED_ADMIN_PASSWORD env var.\n'
  )
}

// ---------------------------------------------------------------------------
// Run seed
// ---------------------------------------------------------------------------
main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed.\n')
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error('\n❌ Seed failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
