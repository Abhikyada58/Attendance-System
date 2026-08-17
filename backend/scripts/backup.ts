/**
 * Database Backup Utility — Module 28
 *
 * Runs pg_dump to create a compressed backup of the AttendX database.
 * Designed to be run via cron or manually.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function runBackup() {
  console.log('[BACKUP] Starting AttendX Database Backup...');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[BACKUP_ERROR] DATABASE_URL is not set.');
    process.exit(1);
  }

  // Ensure backup directory exists
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `attendx_backup_${timestamp}.sql`);
  const archiveFile = `${backupFile}.gz`; // gzip compressed

  try {
    console.log(`[BACKUP] Dumping database to ${backupFile}...`);
    // On Windows, gzip might not be natively available in powershell unless using WSL, 
    // but we can just use plain sql or rely on pg_dump's custom format. 
    // To be universally safe across dev environments, we'll use the plain sql format first.
    
    await execAsync(`pg_dump "${dbUrl}" -F c -f "${backupFile}"`);
    console.log(`[BACKUP] Dump successful.`);
    
    const stats = fs.statSync(backupFile);
    console.log(`[BACKUP] File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // In a production environment, we would upload this file to S3 here.
    
    // Retention Policy: Delete backups older than 7 days
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.startsWith('attendx_backup_')) {
        const filePath = path.join(backupDir, file);
        const fileStats = fs.statSync(filePath);
        const ageInDays = (now - fileStats.mtimeMs) / (1000 * 60 * 60 * 24);
        
        if (ageInDays > 7) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }
    
    console.log(`[BACKUP] Cleanup complete. Removed ${deletedCount} old backups.`);
    console.log(`[BACKUP] SUCCESS - Backup saved to ${backupFile}`);

  } catch (error: any) {
    console.error(`[BACKUP_ERROR] Failed to run backup:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runBackup();
}
