import { db } from '@/db/index';
import { teachers } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teachersList } = body;

    if (!Array.isArray(teachersList) || teachersList.length === 0) {
      return Response.json({ error: 'teachersList must be a non-empty array' }, { status: 400 });
    }

    let insertedCount = 0;
    const errors: string[] = [];

    for (const item of teachersList) {
      const { name, employeeId, email, department } = item;
      if (!name || !employeeId) {
        errors.push(`Row missing name or employee ID: ${JSON.stringify(item)}`);
        continue;
      }

      try {
        await db.insert(teachers).values({
          name: name.trim(),
          employeeId: employeeId.trim(),
          email: email && email.trim() !== '' ? email.trim() : null,
          department: department ? department.trim() : 'CSE',
        });
        insertedCount++;
      } catch (err: any) {
        errors.push(`Failed to insert teacher ${employeeId}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      insertedCount,
      totalCount: teachersList.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Teachers bulk POST error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
