import { prisma } from '../utils/prisma';
import { auditService } from './audit.service';
import { SettingCategory, SettingType } from '@prisma/client';

// Simple in-memory cache
let settingsCache: Record<string, any> = {};
let flagsCache: Record<string, boolean> = {};
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute

export const configurationService = {

  // ==========================================
  // INITIALIZATION & CACHING
  // ==========================================

  async _refreshCache() {
    const now = Date.now();
    if (now - lastFetch < CACHE_TTL && Object.keys(settingsCache).length > 0) {
      return;
    }

    const [settings, flags] = await Promise.all([
      prisma.systemSetting.findMany(),
      prisma.featureFlag.findMany()
    ]);

    settingsCache = {};
    for (const s of settings) {
      if (s.type === 'NUMBER') settingsCache[s.key] = Number(s.value);
      else if (s.type === 'BOOLEAN') settingsCache[s.key] = s.value === 'true';
      else settingsCache[s.key] = s.value;
    }

    flagsCache = {};
    for (const f of flags) {
      flagsCache[f.key] = f.enabled;
    }

    lastFetch = now;
  },

  async invalidateCache() {
    lastFetch = 0;
    await this._refreshCache();
  },

  // ==========================================
  // GETTERS
  // ==========================================

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    await this._refreshCache();
    return settingsCache[key] !== undefined ? settingsCache[key] as T : defaultValue;
  },

  async getFeatureFlag(key: string, defaultValue: boolean = false): Promise<boolean> {
    await this._refreshCache();
    return flagsCache[key] !== undefined ? flagsCache[key] : defaultValue;
  },

  async getAllConfiguration() {
    return {
      settings: await prisma.systemSetting.findMany(),
      flags: await prisma.featureFlag.findMany()
    };
  },

  // ==========================================
  // SETTERS (ADMIN ONLY)
  // ==========================================

  async updateSetting(userId: string, key: string, value: string, category: SettingCategory, type: SettingType, description?: string) {
    const oldSetting = await prisma.systemSetting.findUnique({ where: { key } });
    
    // Type validation
    if (type === 'NUMBER' && isNaN(Number(value))) throw new Error(`Invalid number for ${key}`);
    if (type === 'BOOLEAN' && value !== 'true' && value !== 'false') throw new Error(`Invalid boolean for ${key}`);

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, category, type, description, updatedBy: userId },
      create: { key, value, category, type, description, updatedBy: userId }
    });

    await auditService.logAction(userId, 'SYSTEM_SETTING_CHANGED', 'SystemSetting', key, {
      oldValue: oldSetting?.value || null,
      newValue: value
    });

    await this.invalidateCache();
    return setting;
  },

  async updateFeatureFlag(userId: string, key: string, enabled: boolean, description?: string) {
    const oldFlag = await prisma.featureFlag.findUnique({ where: { key } });
    
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled, description, updatedBy: userId },
      create: { key, enabled, description, updatedBy: userId }
    });

    await auditService.logAction(userId, 'FEATURE_FLAG_CHANGED', 'FeatureFlag', key, {
      oldValue: oldFlag?.enabled || null,
      newValue: enabled
    });

    await this.invalidateCache();
    return flag;
  },

  // ==========================================
  // SEED DEFAULTS (For fresh installs)
  // ==========================================
  async seedDefaults() {
    const defaultSettings = [
      { key: 'WARNING_THRESHOLD', value: '75', category: SettingCategory.ATTENDANCE, type: SettingType.NUMBER, description: 'Minimum attendance % before warning' },
      { key: 'CRITICAL_THRESHOLD', value: '60', category: SettingCategory.ATTENDANCE, type: SettingType.NUMBER, description: 'Critical attendance %' },
      { key: 'INSTITUTION_NAME', value: 'AttendX University', category: SettingCategory.INSTITUTION, type: SettingType.STRING, description: 'Display name of the institution' }
    ];

    const defaultFlags = [
      { key: 'ENABLE_FACE_RECOGNITION', enabled: true, description: 'Allow biometric attendance' },
      { key: 'ENABLE_GAMIFICATION', enabled: true, description: 'Student engagement and goals' }
    ];

    for (const s of defaultSettings) {
      const exists = await prisma.systemSetting.findUnique({ where: { key: s.key } });
      if (!exists) await prisma.systemSetting.create({ data: s });
    }

    for (const f of defaultFlags) {
      const exists = await prisma.featureFlag.findUnique({ where: { key: f.key } });
      if (!exists) await prisma.featureFlag.create({ data: f });
    }
  }

};
