import { Router } from 'express';
import { academicController } from '../../controllers/academic.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Academic Master Data can only be managed by ADMINs
// (In future modules, Students/Faculty might be granted read-only access to some of these via different endpoints)
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// Institutes
router.get('/institutes', academicController.getInstitutes);
router.post('/institutes', academicController.createInstitute);
router.patch('/institutes/:id', academicController.updateInstitute);

// Departments
router.get('/departments', academicController.getDepartments);
router.post('/departments', academicController.createDepartment);
router.patch('/departments/:id', academicController.updateDepartment);

// Academic Years
router.get('/years', academicController.getAcademicYears);
router.post('/years', academicController.createAcademicYear);
router.patch('/years/:id', academicController.updateAcademicYear);

// Semesters
router.get('/semesters', academicController.getSemesters);
router.post('/semesters', academicController.createSemester);
router.patch('/semesters/:id', academicController.updateSemester);

// Classes
router.get('/classes', academicController.getClasses);
router.post('/classes', academicController.createClass);
router.patch('/classes/:id', academicController.updateClass);

// Subjects
router.get('/subjects', academicController.getSubjects);
router.post('/subjects', academicController.createSubject);
router.patch('/subjects/:id', academicController.updateSubject);

// Teaching Assignments
router.get('/teaching-assignments', academicController.getTeachingAssignments);
router.post('/teaching-assignments', academicController.createTeachingAssignment);

export default router;
