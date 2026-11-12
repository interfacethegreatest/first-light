import { closeDatabase } from '../lib/db.js'
import { revokeAllUserSessions } from '../auth/sessions.js'

try {
  if (process.argv.length !== 3) throw new Error('A single user ID is required.')
  const userId = process.argv[2]
  if (!userId) throw new Error('A user ID is required.')
  const count = await revokeAllUserSessions(userId)
  console.log(`Revoked ${count} session(s).`)
} catch {
  console.error('Unable to revoke sessions. Provide one valid user ID and check the database configuration.')
  process.exitCode = 1
} finally {
  try { await closeDatabase() } catch {
    console.error('MongoDB connection cleanup failed.')
    process.exitCode = 1
  }
}
