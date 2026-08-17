/**
 * Database Restore Utility — Module 28
 *
 * Runs pg_restore to recover the AttendX database from a backup file.
 * WARNING: This will overwrite existing data. Use only for Disaster Recovery.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function runRestore() {
  console.log('[RESTORE] Starting AttendX Database Restore...');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[RESTORE_ERROR] DATABASE_URL is not set.');
    process.exit(1);
  }

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    console.error(`[RESTORE_ERROR] Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  // Find the most recent backup
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('attendx_backup_') && f.endsWith('.sql'))
    .sort((a, b) => {
      const statsA = fs.statSync(path.join(backupDir, a));
      const statsB = fs.statSync(path.join(backupDir, b));
      return statsB.mtimeMs - statsA.mtimeMs;
    });

  if (files.length === 0) {
    console.error('[RESTORE_ERROR] No backup files found.');
    process.exit(1);
  }

  const latestBackup = path.join(backupDir, files[0]);
  console.log(`[RESTORE] Selected Backup: ${latestBackup}`);
  
  // Confirmation safety check could be added here in a real interactive CLI
  
  try {
    console.log(`[RESTORE] Dropping current schema and restoring data...`);
    // -c means clean (drop) database objects before recreating
    // -F c means custom format
    await execAsync(`pg_restore -c -d "${dbUrl}" "${latestBackup}"`);
    console.log(`[RESTORE] SUCCESS - Database restored successfully.`);
    
    console.log(`[RESTORE] Running post-restore migrations...`);
    await execAsync(`npx prisma migrate deploy`);
    
    console.log(`[RESTORE] System is ready for use.`);
  } catch (error: any) {
    console.error(`[RESTORE_ERROR] Failed to run restore:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runRestore();
}
