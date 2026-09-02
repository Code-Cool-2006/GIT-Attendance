import { db } from '@/db/index';
import { attendance, classSchedules, subjects, divisions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request, context: { params?: { scheduleId?: string } }) {
  try {
    const urlParts = request.url.split('?')[0].split('/');
    const scheduleIdFromUrl = urlParts[urlParts.length - 1];
    const scheduleId = context?.params?.scheduleId || scheduleIdFromUrl;

    if (!scheduleId) {
      return Response.json({ error: 'Missing scheduleId' }, { status: 400 });
    }

    // Get subject & division info for the schedule
    const [scheduleInfo] = await db
      .select({
        schedule_id: classSchedules.id,
        subject_name: subjects.name,
        division_name: divisions.name,
      })
      .from(classSchedules)
      .innerJoin(subjects, eq(classSchedules.subjectId, subjects.id))
      .innerJoin(divisions, eq(subjects.divisionId, divisions.id))
      .where(eq(classSchedules.id, scheduleId))
      .limit(1);

    const subjectName = scheduleInfo?.subject_name || 'Class';
    const divisionName = scheduleInfo?.division_name || 'Division';

    // Group attendance records by date for this schedule
    const grouped = await db
      .select({
        session_date: sql<string>`DATE(${attendance.date})::text`,
        marked_at: sql<string>`MIN(${attendance.createdAt})::text`,
        present_count: sql<number>`SUM(CASE WHEN ${attendance.status} = 'Present' THEN 1 ELSE 0 END)::int`,
        absent_count: sql<number>`SUM(CASE WHEN ${attendance.status} = 'Absent' THEN 1 ELSE 0 END)::int`,
        leave_count: sql<number>`SUM(CASE WHEN ${attendance.status} = 'Leave' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(attendance)
      .where(eq(attendance.scheduleId, scheduleId))
      .groupBy(sql`DATE(${attendance.date})`);

    const sessions = grouped.map((g, idx) => ({
      id: `${scheduleId}_${g.session_date}`,
      session_date: g.session_date,
      marked_at: g.marked_at,
      updated_at: null,
      schedule_id: scheduleId,
      subject_name: subjectName,
      division_name: divisionName,
      present_count: Number(g.present_count || 0),
      absent_count: Number(g.absent_count || 0),
      leave_count: Number(g.leave_count || 0),
      total: Number(g.total || 0),
    }));

    return Response.json({ sessions });
  } catch (error: any) {
    console.error('GET /api/teacher/attendance/history/[scheduleId] error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
