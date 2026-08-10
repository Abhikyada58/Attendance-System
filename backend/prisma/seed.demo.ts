import { PrismaClient, Role, AccountStatus, SessionStatus, AttendanceMethod, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AttendX Demo Data Seeding...');

  // 1. Clean existing demo data to prevent collision
  console.log('Sweeping old demo data...');
  await prisma.user.deleteMany({
    where: { email: { contains: '@demo.com' } }
  });

  const passwordHash = await bcrypt.hash('demo123', 10);

  // 2. Create Base Entities
  console.log('Generating Academic Structure...');
  const institute = await prisma.institute.create({
    data: {
      name: 'Demo Institute of Technology',
      code: 'DIT',
      isActive: true,
    }
  });

  const department = await prisma.department.create({
    data: {
      name: 'Computer Science',
      code: 'CS',
      instituteId: institute.id,
      isActive: true,
    }
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2026-2027',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-05-30'),
      isActive: true,
    }
  });

  const semester = await prisma.semester.create({
    data: {
      name: 'Fall 2026',
      term: 5,
      isActive: true,
    }
  });

  const demoClass = await prisma.class.create({
    data: {
      name: 'CSE-A',
      division: 'A',
      departmentId: department.id,
      semesterId: semester.id,
      academicYearId: academicYear.id,
      instituteId: institute.id,
      isActive: true
    }
  });

  const demoSubject = await prisma.subject.create({
    data: {
      name: 'Database Management Systems',
      code: 'CS501',
      credits: 4,
      departmentId: department.id,
      semesterId: semester.id,
      isActive: true
    }
  });

  // 3. Create Users
  console.log('Creating Admin...');
  const admin = await prisma.user.create({
    data: {
      name: 'Demo Admin',
      email: 'admin@demo.com',
      passwordHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
    }
  });

  console.log('Creating Faculty...');
  const faculty = await prisma.user.create({
    data: {
      name: 'Demo Faculty (Dr. Smith)',
      email: 'faculty@demo.com',
      passwordHash,
      role: Role.FACULTY,
      status: AccountStatus.ACTIVE,
      faculty: {
        create: {
          facultyId: 'EMP-DEMO-01',
          departmentId: department.id,
          instituteId: institute.id
        }
      }
    },
    include: { faculty: true }
  });

  console.log('Creating Students...');
  const studentHigh = await prisma.user.create({
    data: {
      name: 'Demo Student (High Attendance)',
      email: 'student@demo.com',
      passwordHash,
      role: Role.STUDENT,
      status: AccountStatus.ACTIVE,
      student: {
        create: {
          studentId: 'ENR-DEMO-01',
          departmentId: department.id,
          instituteId: institute.id,
          currentSemId: semester.id,
          academicYearId: academicYear.id,
          classId: demoClass.id
        }
      }
    },
    include: { student: true }
  });

  const studentLow = await prisma.user.create({
    data: {
      name: 'Demo Student (Warning Level)',
      email: 'student.warning@demo.com',
      passwordHash,
      role: Role.STUDENT,
      status: AccountStatus.ACTIVE,
      student: {
        create: {
          studentId: 'ENR-DEMO-02',
          departmentId: department.id,
          instituteId: institute.id,
          currentSemId: semester.id,
          academicYearId: academicYear.id,
          classId: demoClass.id
        }
      }
    },
    include: { student: true }
  });

  // Assign faculty to subject/class
  const assignment = await prisma.teachingAssignment.create({
    data: {
      facultyId: faculty.faculty!.id,
      subjectId: demoSubject.id,
      classId: demoClass.id,
      academicYearId: academicYear.id,
      semesterId: semester.id,
    }
  });

  // 4. Generate Historic Attendance Sessions (Simulating past month)
  console.log('Simulating Historic Attendance Sessions...');
  
  for(let i = 0; i < 10; i++) {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() - (10 - i)); // Backdate up to 10 days ago

    const session = await prisma.attendanceSession.create({
      data: {
        teachingAssignmentId: assignment.id,
        date: sessionDate,
        startTime: sessionDate,
        endTime: new Date(sessionDate.getTime() + 60 * 60 * 1000), // 1 hour later
        status: SessionStatus.CLOSED,
        method: AttendanceMethod.QR,
        createdBy: faculty.id
      }
    });

    // High Attendance Student attends 9 out of 10
    if (i < 9) {
      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: studentHigh.student!.id,
          status: AttendanceStatus.PRESENT,
          markedAt: sessionDate,
          markedBy: faculty.id
        }
      });
    }

    // Low Attendance Student attends 6 out of 10 (60% - Triggering warnings in UI)
    if (i < 6) {
      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: studentLow.student!.id,
          status: AttendanceStatus.PRESENT,
          markedAt: sessionDate,
          markedBy: faculty.id
        }
      });
    }
  }

  console.log('✅ Demo Data Seeded Successfully!');
  console.log('--------------------------------------------------');
  console.log('Admin Login:   admin@demo.com      / demo123');
  console.log('Faculty Login: faculty@demo.com    / demo123');
  console.log('Student Login: student@demo.com    / demo123');
  console.log('Student 2:     student.warning@demo.com / demo123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
