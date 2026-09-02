import { db } from '@/db/index';
import { subjects, divisions, students, divisionStudents, classSchedules, attendance } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const threshold = parseFloat(searchParams.get('threshold') || '75');

    if (!teacherId) {
      return Response.json({ error: 'Missing teacher_id' }, { status: 400 });
    }

    // Get assigned subjects
    const teacherSubjects = await db
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

    const shortageStudents: any[] = [];

    for (const subj of teacherSubjects) {
      // Get all schedules for subject
      const scheds = await db
        .select({ id: classSchedules.id })
        .from(classSchedules)
        .where(eq(classSchedules.subjectId, subj.subject_id));

      const scheduleIds = scheds.map((s) => s.id);
      if (scheduleIds.length === 0) continue;

      // Count total distinct session dates held for this subject
      const [heldRes] = await db
        .select({
          total_held: sql<number>`COUNT(DISTINCT DATE(${attendance.date}))::int`,
        })
        .from(attendance)
        .where(sql`${attendance.scheduleId} IN ${scheduleIds}`);

      const classesHeld = heldRes?.total_held || 0;
      if (classesHeld === 0) continue;

      // Get students in this division
      const divStudents = await db
        .select({
          id: students.id,
          name: students.name,
          rollNumber: students.rollNumber,
        })
        .from(students)
        .innerJoin(divisionStudents, eq(students.id, divisionStudents.studentId))
        .where(eq(divisionStudents.divisionId, subj.division_id));

      for (const st of divStudents) {
        // Count attended sessions for this student
        const [attRes] = await db
          .select({
            attended: sql<number>`COUNT(DISTINCT DATE(${attendance.date}))::int`,
          })
          .from(attendance)
          .where(
            sql`${attendance.scheduleId} IN ${scheduleIds} AND ${attendance.studentId} = ${st.id} AND ${attendance.status} = 'Present'`
          );

        const attended = attRes?.attended || 0;
        const pct = Math.round((attended / classesHeld) * 100);

        if (pct < threshold) {
          // Calculate classes needed to reach threshold
          // (threshold * held - 100 * attended) / (100 - threshold)
          const needed = Math.max(
            0,
            Math.ceil((threshold * classesHeld - 100 * attended) / (100 - threshold))
          );

          shortageStudents.push({
            student_id: st.id,
            student_name: st.name,
            roll_number: st.rollNumber,
            division_name: subj.division_name,
            subject_name: subj.subject_name,
            subject_code: subj.subject_code,
            classes_held: classesHeld,
            attended,
            percentage: pct,
            status: pct < 65 ? 'critical' : 'warning',
            classes_needed: needed,
          });
        }
      }
    }

    return Response.json({ students: shortageStudents });
  } catch (error: any) {
    console.error('GET /api/teacher/reports/shortage error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
