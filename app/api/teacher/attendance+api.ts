import { db } from '@/db/index';
import { attendance } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schedule_id, date, records } = body;

    if (!schedule_id || !date || !records || !Array.isArray(records)) {
      return Response.json({ error: 'Missing schedule_id, date, or records' }, { status: 400 });
    }

    const dateObj = new Date(date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Remove existing records for this schedule & date to avoid duplication
    await db.delete(attendance).where(
      and(
        eq(attendance.scheduleId, schedule_id),
        sql`${attendance.date} >= ${startOfDay.toISOString()} AND ${attendance.date} <= ${endOfDay.toISOString()}`
      )
    );

    const valuesToInsert = records.map((r: any) => ({
      scheduleId: schedule_id,
      studentId: r.student_id || r.studentId,
      status: r.status,
      remarks: r.remarks || null,
      date: dateObj,
    }));

    if (valuesToInsert.length > 0) {
      await db.insert(attendance).values(valuesToInsert);
    }

    return Response.json({
      success: true,
      session_id: schedule_id,
      marked_count: valuesToInsert.length,
    });
  } catch (error: any) {
    console.error('POST /api/teacher/attendance error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
