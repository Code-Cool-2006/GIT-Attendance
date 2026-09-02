import { db } from '@/db/index';
import { subjects, divisions, classSchedules, divisionStudents } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');

    if (!teacherId) {
      return Response.json({ error: 'Missing teacher_id' }, { status: 400 });
    }

    // Get assigned subjects & division details
    const assignedSubjects = await db
      .select({
        subject_id: subjects.id,
        subject_name: subjects.name,
        subject_code: subjects.code,
        division_id: divisions.id,
        division_name: divisions.name,
      })
      .from(subjects)
      .innerJoin(divisions, eq(subjects.divisionId, divisions.id))
      .where(eq(subjects.teacherId, teacherId));

    const result = await Promise.all(
      assignedSubjects.map(async (subj) => {
        // Count enrolled students in division
        const [studentCountRes] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(divisionStudents)
          .where(eq(divisionStudents.divisionId, subj.division_id));

        // Get schedule slots for this subject
        const schedules = await db
          .select({
            id: classSchedules.id,
            day_of_week: classSchedules.dayOfWeek,
            start_time: classSchedules.startTime,
            end_time: classSchedules.endTime,
            room: classSchedules.room,
          })
          .from(classSchedules)
          .where(eq(classSchedules.subjectId, subj.subject_id));

        return {
          ...subj,
          student_count: studentCountRes?.count || 0,
          schedules,
        };
      })
    );

    return Response.json({ classes: result });
  } catch (error: any) {
    console.error('GET /api/teacher/classes error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
