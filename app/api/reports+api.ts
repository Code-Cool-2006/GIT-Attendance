import { db } from '@/db/index';
import { divisions, divisionStudents, students } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // For now, let's just return division-wise student counts as a "report"
    // until the attendance system is fully implemented.
    const result = await db
      .select({
        name: divisions.name,
        count: sql<number>`count(${divisionStudents.studentId})`.mapWith(Number),
      })
      .from(divisions)
      .leftJoin(divisionStudents, eq(divisions.id, divisionStudents.divisionId))
      .groupBy(divisions.id, divisions.name);

    // Mocking some percentages based on the count for now to make the UI look good
    const reports = result.map(r => ({
      name: r.name,
      percentage: r.count > 0 ? Math.min(100, 70 + (r.count * 2)) : 0, // Mock logic
      count: r.count
    }));

    return Response.json(reports);
  } catch (error) {
    console.error('Reports error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
