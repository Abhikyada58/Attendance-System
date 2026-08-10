/**
 * Academic Data Parser
 * 
 * WHY THIS EXISTS:
 * The frontend cannot be trusted to provide accurate student ID or department.
 * Since AttendX uses institutional emails, we parse the exact academic details
 * directly from the email (e.g., 24cs040@charusat.edu.in).
 */

// Supported institution domains mapping
export const INSTITUTE_DOMAINS: Record<string, string> = {
  'charusat.edu.in': 'CSPIT',
  // Can add more institutes later
};

// Supported department codes mapping
export const DEPARTMENT_CODES: Record<string, string> = {
  'cs': 'CSE',
  'ce': 'CE',
  'it': 'IT',
  'ec': 'EC',
  'ee': 'EE',
  'me': 'ME',
};

export interface ParsedAcademicData {
  studentId: string;
  departmentCode: string;
  instituteCode: string;
  admissionYear: number;
  calculatedSemester: number;
}

/**
 * Parses an institutional email into academic data.
 * Throws an error if the format is invalid.
 */
export const parseInstitutionalEmail = (email: string): ParsedAcademicData => {
  const [localPart, domain] = email.toLowerCase().split('@');

  // 1. Validate domain (Institute)
  const instituteCode = INSTITUTE_DOMAINS[domain];
  if (!instituteCode) {
    throw new Error('Unsupported institutional domain. Use a valid university email.');
  }

  // 2. Parse the local part (e.g., 24cs040)
  // Format expectation: [2 digits year][2 letters dept][3 digits roll]
  const regex = /^(\d{2})([a-z]{2})(\d{3})$/;
  const match = localPart.match(regex);

  if (!match) {
    throw new Error('Email local part does not match the expected student ID format (e.g., 24cs040).');
  }

  const [, yearStr, deptStr, rollStr] = match;
  
  // 3. Validate Department
  const departmentCode = DEPARTMENT_CODES[deptStr];
  if (!departmentCode) {
    throw new Error(`Unsupported department code: ${deptStr}`);
  }

  // 4. Calculate Semester 
  // (Assuming current year is 2026 for this logic. In reality, you'd calculate based on current date)
  const admissionYear = 2000 + parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Basic logic: 1 year = 2 semesters. If we are past July, add 1 semester to the year calculation.
  let yearsActive = currentYear - admissionYear;
  let calculatedSemester = (yearsActive * 2) + (currentMonth > 6 ? 1 : 0);
  
  // Cap at semester 8 or handle negative (future) admissions safely
  if (calculatedSemester < 1) calculatedSemester = 1;
  if (calculatedSemester > 8) calculatedSemester = 8;

  return {
    studentId: localPart,
    departmentCode,
    instituteCode,
    admissionYear,
    calculatedSemester,
  };
};
