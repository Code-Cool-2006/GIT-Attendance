import { db } from '@/db/index';
import { academicYears } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const years = await db.select().from(academicYears).orderBy(desc(academicYears.createdAt));
    return Response.json(years);
  } catch (error: any) {
    console.error('Academic Years GET error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, isActive } = body;

    if (!year) {
      return Response.json({ error: 'Academic year is required (e.g. 2024-25)' }, { status: 400 });
    }

    if (isActive) {
      // Deactivate all existing academic years
      await db.update(academicYears).set({ isActive: false });
    }

    const [newYear] = await db.insert(academicYears).values({
      year: year.trim(),
      isActive: Boolean(isActive),
    }).returning();

    return Response.json(newYear);
  } catch (error: any) {
    console.error('Academic Years POST error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return Response.json({ error: 'Academic Year ID is required' }, { status: 400 });
    }

    if (isActive) {
      await db.update(academicYears).set({ isActive: false });
    }

    const [updated] = await db.update(academicYears)
      .set({ isActive: Boolean(isActive) })
      .where(eq(academicYears.id, id))
      .returning();

    return Response.json(updated);
  } catch (error: any) {
    console.error('Academic Years PUT error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
