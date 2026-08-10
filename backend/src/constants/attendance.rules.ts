import { configurationService } from '../services/configuration.service';

// Deprecated: Do not use for new code. Will be phased out.
export const ATTENDANCE_RULES = {
  OFFICIAL_SESSION_STATUS: 'CLOSED',
  LATE_COUNTS_AS_ATTENDED: true
};

export function calculatePercentage(attended: number, applicable: number): number {
  if (applicable === 0) return 0;
  return parseFloat(((attended / applicable) * 100).toFixed(2));
}

export async function determineStatus(percentage: number, applicable: number): Promise<'SAFE' | 'WARNING' | 'CRITICAL' | 'NO_DATA'> {
  if (applicable === 0) return 'NO_DATA';
  
  const warning = await configurationService.getSetting('WARNING_THRESHOLD', 75);
  const critical = await configurationService.getSetting('CRITICAL_THRESHOLD', 60);

  if (percentage > warning) return 'SAFE';
  if (percentage > critical) return 'WARNING';
  return 'CRITICAL';
}
