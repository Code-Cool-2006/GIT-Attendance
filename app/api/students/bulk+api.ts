import { db } from '@/db/index';
import { students, divisionStudents } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentsList } = body;

    if (!Array.isArray(studentsList) || studentsList.length === 0) {
      return Response.json({ error: 'studentsList must be a non-empty array' }, { status: 400 });
    }

    let insertedCount = 0;
    const errors: string[] = [];

    for (const item of studentsList) {
      const { name, rollNumber, email, phone, department, semester, divisionId } = item;
      if (!name || !rollNumber) {
        errors.push(`Row missing name or roll number: ${JSON.stringify(item)}`);
        continue;
      }

      try {
        const [student] = await db.insert(students).values({
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          email: email && email.trim() !== '' ? email.trim() : null,
          phone: phone && phone.trim() !== '' ? phone.trim() : null,
          department: department ? department.trim() : null,
          semester: semester ? parseInt(semester) : null,
        }).returning();

        if (divisionId && divisionId !== '' && divisionId !== 'null' && divisionId !== 'Unassigned') {
          await db.insert(divisionStudents).values({
            studentId: student.id,
            divisionId: divisionId,
          });
        }
        insertedCount++;
      } catch (err: any) {
        errors.push(`Failed to insert ${rollNumber}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      insertedCount,
      totalCount: studentsList.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Students bulk POST error details:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
