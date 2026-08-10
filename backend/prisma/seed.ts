import { PrismaClient, Role, SettingCategory, SettingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AttendX database...');

  // -----------------------------------
  // 1. INSTITUTE
  // -----------------------------------
  const institute = await prisma.institute.upsert({
    where: { code: 'CSPIT' },
    update: {},
    create: {
      name: 'Chandubhai S Patel Institute of Technology',
      code: 'CSPIT',
      isActive: true,
    },
  });
  console.log('✅ Institute created:', institute.code);

  // -----------------------------------
  // 2. DEPARTMENT
  // -----------------------------------
  const department = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      isActive: true,
      instituteId: institute.id,
    },
  });
  console.log('✅ Department created:', department.code);

  // -----------------------------------
  // 3. ACADEMIC YEAR
  // -----------------------------------
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2024-2025' },
    update: {},
    create: {
      name: '2024-2025',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  });
  console.log('✅ Academic Year created:', academicYear.name);

  // -----------------------------------
  // 4. SEMESTER
  // -----------------------------------
  const semester = await prisma.semester.upsert({
    where: { id: 'sem-5-default' },
    update: {},
    create: {
      id: 'sem-5-default',
      term: 5,
      name: 'Semester 5',
      isActive: true,
    },
  });
  console.log('✅ Semester created:', semester.name);

  // -----------------------------------
  // 5. CLASS
  // -----------------------------------
  const classGroup = await prisma.class.upsert({
    where: {
      departmentId_semesterId_academicYearId_division: {
        departmentId: department.id,
        semesterId: semester.id,
        academicYearId: academicYear.id,
        division: 'A',
      },
    },
    update: {},
    create: {
      name: 'CSE Semester 5',
      division: 'A',
      isActive: true,
      academicYearId: academicYear.id,
      semesterId: semester.id,
      departmentId: department.id,
      instituteId: institute.id,
    },
  });
  console.log('✅ Class created:', classGroup.name);

  // -----------------------------------
  // 6. SUBJECTS
  // -----------------------------------
  const subjectData = [
    { code: 'CS501', name: 'Operating Systems', credits: 4 },
    { code: 'CS502', name: 'Database Management Systems', credits: 4 },
    { code: 'CS503', name: 'Computer Networks', credits: 4 },
    { code: 'CS504', name: 'Software Engineering', credits: 3 },
    { code: 'CS505', name: 'Theory of Computation', credits: 3 },
    { code: 'CS506', name: 'Machine Learning', credits: 4 },
  ];

  const subjects = [];
  for (const s of subjectData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        name: s.name,
        credits: s.credits,
        isActive: true,
        departmentId: department.id,
        semesterId: semester.id,
      },
    });
    subjects.push(subject);
  }
  console.log(`✅ ${subjects.length} Subjects created`);

  // -----------------------------------
  // 7. ADMIN USER
  // -----------------------------------
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cspit.edu' },
    update: {},
    create: {
      email: 'admin@cspit.edu',
      name: 'System Admin',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created: admin@cspit.edu / Admin@123');

  // -----------------------------------
  // 8. FACULTY USER
  // -----------------------------------
  const facultyHash = await bcrypt.hash('Faculty@123', 12);
  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@cspit.edu' },
    update: {},
    create: {
      email: 'faculty@cspit.edu',
      name: 'Dr. Ramesh Patel',
      passwordHash: facultyHash,
      role: Role.FACULTY,
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { userId: facultyUser.id },
    update: {},
    create: {
      facultyId: 'FAC001',
      userId: facultyUser.id,
      departmentId: department.id,
      instituteId: institute.id,
    },
  });
  console.log('✅ Faculty user created: faculty@cspit.edu / Faculty@123');

  // -----------------------------------
  // 9. STUDENT USER
  // -----------------------------------
  const studentHash = await bcrypt.hash('Student@123', 12);
  const studentUser = await prisma.user.upsert({
    where: { email: '24cs043@charusat.edu.in' },
    update: {},
    create: {
      email: '24cs043@charusat.edu.in',
      name: 'Abhi Kyada',
      passwordHash: studentHash,
      role: Role.STUDENT,
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      studentId: '24cs043',
      userId: studentUser.id,
      departmentId: department.id,
      instituteId: institute.id,
      currentSemId: semester.id,
      academicYearId: academicYear.id,
      classId: classGroup.id,
    },
  });
  console.log('✅ Student user created: 24cs043@charusat.edu.in / Student@123');

  // -----------------------------------
  // 10. TEACHING ASSIGNMENTS
  // -----------------------------------
  for (const subject of subjects) {
    await prisma.teachingAssignment.upsert({
      where: {
        classId_subjectId: {
          classId: classGroup.id,
          subjectId: subject.id,
        },
      },
      update: {},
      create: {
        facultyId: faculty.id,
        subjectId: subject.id,
        classId: classGroup.id,
        academicYearId: academicYear.id,
        semesterId: semester.id,
      },
    });
  }
  console.log(`✅ ${subjects.length} Teaching Assignments created`);

  // -----------------------------------
  // 11. SYSTEM SETTINGS
  // -----------------------------------
  const settings = [
    { key: 'WARNING_THRESHOLD', value: '75', category: SettingCategory.ATTENDANCE, type: SettingType.NUMBER, description: 'Attendance % below which a warning is shown' },
    { key: 'CRITICAL_THRESHOLD', value: '60', category: SettingCategory.ATTENDANCE, type: SettingType.NUMBER, description: 'Attendance % below which status is CRITICAL' },
    { key: 'LATE_COUNTS_AS_ATTENDED', value: 'true', category: SettingCategory.ATTENDANCE, type: SettingType.BOOLEAN, description: 'Whether LATE status counts as attendance' },
    { key: 'QR_EXPIRY_SECONDS', value: '30', category: SettingCategory.QR, type: SettingType.NUMBER, description: 'How long each QR code is valid (seconds)' },
    { key: 'FACE_THRESHOLD', value: '0.6', category: SettingCategory.FACE_RECOGNITION, type: SettingType.NUMBER, description: 'Face recognition confidence threshold (0-1)' },
    { key: 'INSTITUTION_NAME', value: 'Chandubhai S Patel Institute of Technology', category: SettingCategory.INSTITUTION, type: SettingType.STRING, description: 'Name of the institution' },
    { key: 'INSTITUTION_CODE', value: 'CSPIT', category: SettingCategory.INSTITUTION, type: SettingType.STRING, description: 'Short code for the institution' },
    { key: 'ACADEMIC_YEAR', value: '2024-2025', category: SettingCategory.ACADEMIC, type: SettingType.STRING, description: 'Current active academic year' },
    { key: 'MAX_LEAVE_DAYS', value: '10', category: SettingCategory.SYSTEM, type: SettingType.NUMBER, description: 'Maximum leave days allowed per semester' },
    { key: 'ENGAGEMENT_POINTS_PER_DAY', value: '10', category: SettingCategory.GAMIFICATION, type: SettingType.NUMBER, description: 'Points earned per day of full attendance' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`✅ ${settings.length} System Settings seeded`);

  // -----------------------------------
  // 12. FEATURE FLAGS
  // -----------------------------------
  const flags = [
    { key: 'ENABLE_FACE_RECOGNITION', enabled: true, description: 'Enable AI face recognition attendance' },
    { key: 'ENABLE_QR_ATTENDANCE', enabled: true, description: 'Enable QR code based attendance' },
    { key: 'ENABLE_GAMIFICATION', enabled: true, description: 'Enable gamification & achievement system' },
    { key: 'ENABLE_AI_INSIGHTS', enabled: true, description: 'Enable AI-powered attendance insights' },
    { key: 'ENABLE_SMART_PLANNING', enabled: true, description: 'Enable smart attendance planning module' },
    { key: 'ENABLE_SUPPORT_TICKETS', enabled: true, description: 'Enable student support ticket system' },
  ];

  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: {},
      create: f,
    });
  }
  console.log(`✅ ${flags.length} Feature Flags seeded`);

  // -----------------------------------
  // 13. ACHIEVEMENTS
  // -----------------------------------
  const achievements = [
    { name: 'Perfect Week', description: 'Attended all classes in a week', criteriaKey: 'PERFECT_WEEK', icon: '🏆', rarity: 'COMMON' },
    { name: '10-Day Streak', description: 'Attended classes 10 days in a row', criteriaKey: 'STREAK_10', icon: '🔥', rarity: 'RARE' },
    { name: 'Month Champion', description: 'Perfect attendance for a full month', criteriaKey: 'PERFECT_MONTH', icon: '🥇', rarity: 'EPIC' },
    { name: 'Top Performer', description: '95%+ attendance in a semester', criteriaKey: 'TOP_SEMESTER', icon: '⭐', rarity: 'LEGENDARY' },
    { name: 'Early Bird', description: 'Never late in 30 classes', criteriaKey: 'NEVER_LATE_30', icon: '🌅', rarity: 'RARE' },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { criteriaKey: a.criteriaKey },
      update: {},
      create: a,
    });
  }
  console.log(`✅ ${achievements.length} Achievements seeded`);

  // -----------------------------------
  // 14. NOTIFICATION PREFERENCES
  // -----------------------------------
  for (const userId of [adminUser.id, facultyUser.id, studentUser.id]) {
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        emailEnabled: false,
        attendanceAlertsEnabled: true,
        systemAlertsEnabled: true,
      },
    });
  }
  console.log('✅ Notification Preferences created');

  console.log('\n🎉 Seeding complete! Here are your login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 ADMIN    → admin@cspit.edu          / Admin@123');
  console.log('👨‍🏫 FACULTY  → faculty@cspit.edu        / Faculty@123');
  console.log('🎓 STUDENT  → 24cs043@charusat.edu.in  / Student@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
