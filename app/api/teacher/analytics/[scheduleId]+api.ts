import { db } from '@/db/index';
import { attendance } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request, context: { params?: { scheduleId?: string } }) {
  try {
    const urlParts = request.url.split('?')[0].split('/');
    const scheduleIdFromUrl = urlParts[urlParts.length - 1];
    const scheduleId = context?.params?.scheduleId || scheduleIdFromUrl;

    if (!scheduleId) {
      return Response.json({ error: 'Missing scheduleId' }, { status: 400 });
    }

    // Per session stats
    const sessionRows = await db
      .select({
        session_date: sql<string>`DATE(${attendance.date})::text`,
        present: sql<number>`SUM(CASE WHEN ${attendance.status} = 'Present' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(attendance)
      .where(eq(attendance.scheduleId, scheduleId))
      .groupBy(sql`DATE(${attendance.date})`)
      .orderBy(sql`DATE(${attendance.date})`);

    const sessions = sessionRows.map((s) => {
      const present = Number(s.present || 0);
      const total = Number(s.total || 0);
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        date: s.session_date,
        present,
        total,
        pct,
      };
    });

    // Weekly stats
    const weeklyRows = await db
      .select({
        week: sql<string>`TO_CHAR(${attendance.date}, 'YYYY-"W"IW')`,
        present: sql<number>`SUM(CASE WHEN ${attendance.status} = 'Present' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(attendance)
      .where(eq(attendance.scheduleId, scheduleId))
      .groupBy(sql`TO_CHAR(${attendance.date}, 'YYYY-"W"IW')`)
      .orderBy(sql`TO_CHAR(${attendance.date}, 'YYYY-"W"IW')`);

    const weekly = weeklyRows.map((w) => {
      const present = Number(w.present || 0);
      const total = Number(w.total || 0);
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        week: w.week,
        present,
        total,
        pct,
      };
    });

    return Response.json({ weekly, sessions });
  } catch (error: any) {
    console.error('GET /api/teacher/analytics/[scheduleId] error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
