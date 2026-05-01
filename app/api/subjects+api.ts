import { db } from '@/db/index';
import { subjects, divisions, teachers } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const divisionId = searchParams.get('divisionId');

    const allSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        divisionId: subjects.divisionId,
        divisionName: divisions.name,
        teacherId: subjects.teacherId,
        teacherName: teachers.name,
        createdAt: subjects.createdAt,
      })
      .from(subjects)
      .leftJoin(divisions, eq(subjects.divisionId, divisions.id))
      .leftJoin(teachers, eq(subjects.teacherId, teachers.id))
      .where(divisionId ? eq(subjects.divisionId, divisionId) : undefined)
      .orderBy(desc(subjects.createdAt));

    return Response.json(allSubjects);
  } catch (error: any) {
    console.error('Subjects GET error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, divisionId, teacherId } = body;

    if (!name || !code || !divisionId) {
      return Response.json({ error: 'Name, Code, and Division are required' }, { status: 400 });
    }

    const [newSubject] = await db.insert(subjects).values({
      name,
      code,
      divisionId,
      teacherId,
    }).returning();

    return Response.json(newSubject);
  } catch (error: any) {
    console.error('Subjects POST error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, code, divisionId, teacherId } = body;

    if (!id || !name || !code || !divisionId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [updatedSubject] = await db.update(subjects)
      .set({
        name,
        code,
        divisionId,
        teacherId,
      })
      .where(eq(subjects.id, id))
      .returning();

    return Response.json(updatedSubject);
  } catch (error: any) {
    console.error('Subjects PUT error:', error);
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

    await db.delete(subjects).where(eq(subjects.id, id));
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Subjects DELETE error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
