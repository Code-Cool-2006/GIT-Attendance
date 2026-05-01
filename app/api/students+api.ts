import { db } from '@/db/index';
import { students, divisionStudents, divisions } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const allStudents = await db
      .select({
        id: students.id,
        name: students.name,
        rollNumber: students.rollNumber,
        email: students.email,
        phone: students.phone,
        department: students.department,
        semester: students.semester,
        divisionId: divisions.id,
        divisionName: divisions.name,
        createdAt: students.createdAt,
      })
      .from(students)
      .leftJoin(divisionStudents, eq(students.id, divisionStudents.studentId))
      .leftJoin(divisions, eq(divisionStudents.divisionId, divisions.id))
      .orderBy(desc(students.createdAt));

    return Response.json(allStudents);
  } catch (error: any) {
    console.error('Students GET error details:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rollNumber, email, phone, department, semester, divisionId } = body;

    if (!name || !rollNumber) {
      return Response.json({ error: 'Name and Roll Number are required' }, { status: 400 });
    }

    console.log(`Creating student ${name} with division ${divisionId}`);
    
    const [student] = await db.insert(students).values({
      name,
      rollNumber,
      email: email && email.trim() !== '' ? email : null,
      phone: phone && phone.trim() !== '' ? phone : null,
      department,
      semester: semester ? parseInt(semester) : null,
    }).returning();

    if (divisionId && divisionId !== '') {
      console.log(`Assigning new student ${student.id} to division ${divisionId}`);
      await db.insert(divisionStudents).values({
        studentId: student.id,
        divisionId: divisionId,
      });
    }

    return Response.json(student);
  } catch (error: any) {
    console.error('Students POST error details:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('PUT Student body:', JSON.stringify(body));
    const { id, name, rollNumber, email, phone, department, semester, divisionId } = body;

    if (!id || !name || !rollNumber) {
      console.error('Missing fields in PUT student:', { id, name, rollNumber });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = {
      name,
      rollNumber,
    };
    
    // Only set these if they are present in the body to avoid overwriting with null
    if (email !== undefined) updateData.email = email && email.trim() !== '' ? email : null;
    if (phone !== undefined) updateData.phone = phone && phone.trim() !== '' ? phone : null;
    if (department !== undefined) updateData.department = department;
    if (semester !== undefined) updateData.semester = semester ? parseInt(semester) : null;

    const [student] = await db.update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning();

    if (!student) {
      console.error(`Student with ID ${id} not found during update`);
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log(`Clearing existing divisions for student ${id}`);
    await db.delete(divisionStudents).where(eq(divisionStudents.studentId, id));

    if (divisionId && divisionId !== '' && divisionId !== 'null' && divisionId !== 'Unassigned') {
      console.log(`Verifying division ${divisionId} exists`);
      const [div] = await db.select().from(divisions).where(eq(divisions.id, divisionId)).limit(1);
      if (!div) {
        console.error(`Division ${divisionId} not found`);
        return Response.json({ error: 'Selected division does not exist' }, { status: 400 });
      }

      console.log(`Assigning student ${id} to division ${divisionId}`);
      await db.insert(divisionStudents).values({
        studentId: id,
        divisionId: divisionId,
      });
    }

    return Response.json(student);
  } catch (error: any) {
    console.error('CRITICAL: Students PUT error details:', error);
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

    await db.delete(divisionStudents).where(eq(divisionStudents.studentId, id));
    await db.delete(students).where(eq(students.id, id));
    
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Students DELETE error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
