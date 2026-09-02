import { db } from '@/db/index';
import { teachers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { employee_id, password } = await request.json();

    if (!employee_id || !password) {
      return Response.json({ error: 'Employee ID and password are required' }, { status: 400 });
    }

    const trimmedEmpId = String(employee_id).trim();

    // Query teacher by employeeId (case insensitive)
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(sql`LOWER(${teachers.employeeId}) = LOWER(${trimmedEmpId})`)
      .limit(1);

    if (!teacher) {
      return Response.json({ error: 'Invalid Employee ID or password' }, { status: 401 });
    }

    // Default password rule: lowercased employeeId
    const expectedPassword = teacher.employeeId.toLowerCase();
    if (password !== expectedPassword && password !== teacher.employeeId) {
      return Response.json({ error: 'Invalid Employee ID or password' }, { status: 401 });
    }

    return Response.json({
      success: true,
      teacher: {
        id: teacher.id,
        employee_id: teacher.employeeId,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        is_active: true,
        temp_password: false,
      },
    });
  } catch (error: any) {
    console.error('Teacher Auth Login error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
