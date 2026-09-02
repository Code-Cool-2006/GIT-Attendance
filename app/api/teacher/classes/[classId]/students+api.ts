import { db } from '@/db/index';
import { students, divisionStudents, classSchedules, subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, context: { params?: { classId?: string } }) {
  try {
    const urlParts = request.url.split('?')[0].split('/');
    const classIdFromUrl = urlParts[urlParts.length - 2] === 'classes' ? urlParts[urlParts.length - 1] : urlParts[urlParts.length - 2];
    const classId = context?.params?.classId || classIdFromUrl;

    if (!classId) {
      return Response.json({ error: 'Missing classId' }, { status: 400 });
    }

    let targetDivisionId: string | null = null;

    // 1. Try checking if classId is a scheduleId
    const [sched] = await db
      .select({ subjectId: classSchedules.subjectId })
      .from(classSchedules)
      .where(eq(classSchedules.id, classId))
      .limit(1);

    if (sched) {
      const [subj] = await db
        .select({ divisionId: subjects.divisionId })
        .from(subjects)
        .where(eq(subjects.id, sched.subjectId))
        .limit(1);
      if (subj) targetDivisionId = subj.divisionId;
    } else {
      // 2. Try checking if classId is a subjectId
      const [subj] = await db
        .select({ divisionId: subjects.divisionId })
        .from(subjects)
        .where(eq(subjects.id, classId))
        .limit(1);
      if (subj) {
        targetDivisionId = subj.divisionId;
      } else {
        // 3. Otherwise assume classId is divisionId directly
        targetDivisionId = classId;
      }
    }

    if (!targetDivisionId) {
      return Response.json({ students: [] });
    }

    // Get students in targetDivisionId
    const studentList = await db
      .select({
        id: students.id,
        roll_number: students.rollNumber,
        name: students.name,
        email: students.email,
      })
      .from(students)
      .innerJoin(divisionStudents, eq(students.id, divisionStudents.studentId))
      .where(eq(divisionStudents.divisionId, targetDivisionId));

    return Response.json({ students: studentList });
  } catch (error: any) {
    console.error('GET /api/teacher/classes/[classId]/students error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
