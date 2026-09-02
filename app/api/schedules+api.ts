import { db } from '@/db/index';
import { classSchedules, subjects, divisions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    let query = db
      .select({
        id: classSchedules.id,
        subjectId: classSchedules.subjectId,
        subjectName: subjects.name,
        divisionName: divisions.name,
        dayOfWeek: classSchedules.dayOfWeek,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        room: classSchedules.room,
        createdAt: classSchedules.createdAt,
      })
      .from(classSchedules)
      .leftJoin(subjects, eq(classSchedules.subjectId, subjects.id))
      .leftJoin(divisions, eq(subjects.divisionId, divisions.id))
      .$dynamic();

    if (subjectId) {
      query = query.where(eq(classSchedules.subjectId, subjectId));
    }

    const allSchedules = await query.orderBy(desc(classSchedules.createdAt));
    return Response.json(allSchedules);
  } catch (error: any) {
    console.error('Schedules GET error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subjectId, dayOfWeek, startTime, endTime, room } = body;

    if (!subjectId || !dayOfWeek || !startTime || !endTime) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newSchedule] = await db.insert(classSchedules).values({
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    }).returning();

    return Response.json(newSchedule);
  } catch (error: any) {
    console.error('Schedules POST error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, subjectId, dayOfWeek, startTime, endTime, room } = body;

    if (!id || !subjectId || !dayOfWeek || !startTime || !endTime) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [updatedSchedule] = await db.update(classSchedules)
      .set({
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      })
      .where(eq(classSchedules.id, id))
      .returning();

    return Response.json(updatedSchedule);
  } catch (error: any) {
    console.error('Schedules PUT error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(classSchedules).where(eq(classSchedules.id, id));
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Schedules DELETE error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
