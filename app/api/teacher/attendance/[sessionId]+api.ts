import { db } from '@/db/index';
import { attendance } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Teacher app sends sessionId as `scheduleUUID_YYYY-MM-DD`; strip date suffix to get real schedule UUID
function parseScheduleId(raw: string): string {
  const idx = raw.lastIndexOf('_');
  // if the part after _ looks like a date, strip it
  if (idx > 0 && /^\d{4}-\d{2}-\d{2}$/.test(raw.slice(idx + 1))) {
    return raw.slice(0, idx);
  }
  return raw;
}

export async function GET(request: Request, context: { params?: { sessionId?: string } }) {
  try {
    const urlParts = request.url.split('?')[0].split('/');
    const sessionIdFromUrl = urlParts[urlParts.length - 1];
    const sessionId = parseScheduleId(context?.params?.sessionId || sessionIdFromUrl);

    if (!sessionId) {
      return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Query records where attendance.scheduleId = sessionId (or attendance.id = sessionId)
    const records = await db
      .select({
        id: attendance.id,
        student_id: attendance.studentId,
        status: attendance.status,
        remarks: attendance.remarks,
        date: attendance.date,
        schedule_id: attendance.scheduleId,
      })
      .from(attendance)
      .where(eq(attendance.scheduleId, sessionId));

    if (records.length === 0) {
      return Response.json({ session: null });
    }

    return Response.json({
      session: {
        id: sessionId,
        schedule_id: records[0].schedule_id,
        date: records[0].date,
        records: records.map((r) => ({
          student_id: r.student_id,
          status: r.status,
          remarks: r.remarks,
        })),
      },
    });
  } catch (error: any) {
    console.error('GET /api/teacher/attendance/[sessionId] error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params?: { sessionId?: string } }) {
  try {
    const urlParts = request.url.split('?')[0].split('/');
    const sessionIdFromUrl = urlParts[urlParts.length - 1];
    const sessionId = parseScheduleId(context?.params?.sessionId || sessionIdFromUrl);

    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return Response.json({ error: 'Missing records array' }, { status: 400 });
    }

    // Update each student's attendance status for this schedule
    for (const r of records) {
      const studentId = r.student_id || r.studentId;
      if (studentId && r.status) {
        await db
          .update(attendance)
          .set({ status: r.status, remarks: r.remarks || '' })
          .where(
            and(
              eq(attendance.scheduleId, sessionId),
              eq(attendance.studentId, studentId)
            )
          );
      }
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/teacher/attendance/[sessionId] error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
