import { db } from '@/db/index';
import { divisions, academicYears, divisionStudents, subjects } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const allDivisions = await db.select({
      id: divisions.id,
      name: divisions.name,
      department: divisions.department,
      semester: divisions.semester,
      academicYearId: divisions.academicYearId,
      maxCapacity: divisions.maxCapacity,
      createdAt: divisions.createdAt,
      students: sql<number>`count(distinct ${divisionStudents.studentId})`.mapWith(Number),
      subjects: sql<number>`count(distinct ${subjects.id})`.mapWith(Number),
    })
    .from(divisions)
    .leftJoin(divisionStudents, eq(divisions.id, divisionStudents.divisionId))
    .leftJoin(subjects, eq(divisions.id, subjects.divisionId))
    .groupBy(divisions.id)
    .orderBy(desc(divisions.createdAt));

    return Response.json(allDivisions);
  } catch (error: any) {
    console.error('Divisions GET error details:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, department, semester, academicYearId, maxCapacity } = body;

    if (!name || !department || !semester || !academicYearId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newDivision] = await db.insert(divisions).values({
      name,
      department,
      semester: parseInt(semester),
      academicYearId,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
    }).returning();

    return Response.json(newDivision);
  } catch (error: any) {
    console.error('Divisions POST error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, department, semester, maxCapacity } = body;

    if (!id || !name || !department || !semester) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [updatedDivision] = await db.update(divisions)
      .set({
        name,
        department,
        semester: parseInt(semester),
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
      })
      .where(eq(divisions.id, id))
      .returning();

    return Response.json(updatedDivision);
  } catch (error: any) {
    console.error('Divisions PUT error:', error);
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

    await db.delete(divisionStudents).where(eq(divisionStudents.divisionId, id));
    await db.delete(subjects).where(eq(subjects.divisionId, id));
    await db.delete(divisions).where(eq(divisions.id, id));
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Divisions DELETE error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
