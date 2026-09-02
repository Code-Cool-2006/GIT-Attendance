import { db } from '@/db/index';
import { subjects, divisions, classSchedules, attendance } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const dayOfWeek = searchParams.get('day_of_week');

    if (!teacherId) {
      return Response.json({ error: 'Missing teacher_id' }, { status: 400 });
    }

    // Determine day name if not provided
    const targetDate = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = dayOfWeek || days[targetDate.getDay()];

    // Fetch schedules for teacher's subjects on targetDay
    const schedulesList = await db
      .select({
        schedule_id: classSchedules.id,
        subject_id: subjects.id,
        subject_name: subjects.name,
        subject_code: subjects.code,
        division_name: divisions.name,
        day_of_week: classSchedules.dayOfWeek,
        start_time: classSchedules.startTime,
        end_time: classSchedules.endTime,
        room: classSchedules.room,
      })
      .from(classSchedules)
      .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
      .innerJoin(divisions, eq(subjects.divisionId, divisions.id))
      .where(
        and(
          eq(subjects.teacherId, teacherId),
          sql`LOWER(${classSchedules.dayOfWeek}) = LOWER(${targetDay})`
        )
      );

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const classesWithStatus = await Promise.all(
      schedulesList.map(async (item) => {
        const markedRecords = await db
          .select({ id: attendance.id })
          .from(attendance)
          .where(
            and(
              eq(attendance.scheduleId, item.schedule_id),
              sql`${attendance.date} >= ${startOfDay.toISOString()} AND ${attendance.date} <= ${endOfDay.toISOString()}`
            )
          )
          .limit(1);

        const already_marked = markedRecords.length > 0;
        return {
          ...item,
          already_marked,
          session_id: already_marked ? item.schedule_id : undefined,
        };
      })
    );

    return Response.json({ classes: classesWithStatus });
  } catch (error: any) {
    console.error('GET /api/teacher/schedule/today error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
