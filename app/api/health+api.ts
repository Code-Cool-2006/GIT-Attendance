import { db } from '@/db/index';
import { academicYears } from '@/db/schema';

export async function GET(request: Request) {
  try {
    const years = await db.select().from(academicYears);
    return Response.json({ 
      status: 'ok', 
      database: 'connected',
      data: years 
    });
  } catch (error: any) {
    return Response.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
