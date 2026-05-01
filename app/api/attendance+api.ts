import { db } from '@/db/index';
import { attendance, students } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if (!scheduleId || !dateStr) {
      return Response.json({ error: 'Missing scheduleId or date' }, { status: 400 });
    }

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        status: attendance.status,
        remarks: attendance.remarks,
        date: attendance.date,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.scheduleId, scheduleId),
          sql`${attendance.date} >= ${startOfDay.toISOString()} AND ${attendance.date} <= ${endOfDay.toISOString()}`
        )
      );

    return Response.json(records);
  } catch (error: any) {
    console.error('Attendance GET error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scheduleId, date, records } = body; // records: [{ studentId, status, remarks }]

    if (!scheduleId || !date || !records || !Array.isArray(records)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dateObj = new Date(date);

    // Neon doesn't support transactions well via HTTP, so we do it sequentially
    // but first we delete existing records for that day/schedule to prevent duplicates
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    await db.delete(attendance).where(
      and(
        eq(attendance.scheduleId, scheduleId),
        sql`${attendance.date} >= ${startOfDay.toISOString()} AND ${attendance.date} <= ${endOfDay.toISOString()}`
      )
    );

    const insertValues = records.map((r: any) => ({
      scheduleId,
      studentId: r.studentId,
      status: r.status,
      remarks: r.remarks || null,
      date: dateObj,
    }));

    if (insertValues.length > 0) {
      await db.insert(attendance).values(insertValues);
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Attendance POST error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
