import { db } from '@/db/index';
import { teachers, subjects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allTeachers = await db.select().from(teachers).orderBy(desc(teachers.createdAt));
    
    // For each teacher, we might want to fetch their subjects, but let's keep it simple for now
    // and just return the teacher list.
    return Response.json(allTeachers);
  } catch (error: any) {
    console.error('Teachers GET error details:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Teachers POST request body:', JSON.stringify(body));
    const { name, employeeId, email, department } = body;

    if (!name || !employeeId) {
      return Response.json({ error: 'Name and Employee ID are required' }, { status: 400 });
    }

    const values = {
      name,
      employeeId,
      email: email && email.trim() !== '' ? email : null,
      department,
    };
    
    console.log('Inserting teacher with values:', JSON.stringify(values));

    const [newTeacher] = await db.insert(teachers)
      .values(values)
      .onConflictDoUpdate({
        target: teachers.employeeId,
        set: {
          name,
          email: values.email,
          department,
        }
      })
      .returning();

    console.log('Successfully created teacher:', newTeacher.id);
    return Response.json(newTeacher);
  } catch (error: any) {
    console.error('Teachers POST CRITICAL ERROR:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, employeeId, email, department } = body;

    if (!id || !name || !employeeId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [updatedTeacher] = await db.update(teachers)
      .set({
        name,
        employeeId,
        email: email && email.trim() !== '' ? email : null,
        department,
      })
      .where(eq(teachers.id, id))
      .returning();

    return Response.json(updatedTeacher);
  } catch (error: any) {
    console.error('Teachers PUT error details:', error);
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

    await db.delete(teachers).where(eq(teachers.id, id));
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Teachers DELETE error details:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
