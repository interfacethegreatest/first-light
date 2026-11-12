import { closeDatabase, pingDatabase } from '../lib/db.js'

try {
  await pingDatabase()
  console.log('MongoDB ping succeeded.')
} catch {
  console.error('MongoDB ping failed. Check MONGODB_URI, database access and network configuration.')
  process.exitCode = 1
} finally {
  try { await closeDatabase() } catch {
    console.error('MongoDB connection cleanup failed.')
    process.exitCode = 1
  }
}
