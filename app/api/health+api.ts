import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { db } from '@/db/index';
import { academicYears } from '@/db/schema';

export async function GET(request: ExpoRequest) {
  try {
    const years = await db.select().from(academicYears);
    return ExpoResponse.json({ 
      status: 'ok', 
      database: 'connected',
      data: years 
    });
  } catch (error: any) {
    return ExpoResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
