import { db } from '@/db/index';
import { admins } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const [admin] = await db
      .select()
      .from(admins)
      .where(and(eq(admins.email, email), eq(admins.password, password)))
      .limit(1);

    if (!admin) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // In a real app, you would create a JWT or session here
    return Response.json({ 
      success: true, 
      user: { 
        id: admin.id, 
        name: admin.name, 
        email: admin.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
