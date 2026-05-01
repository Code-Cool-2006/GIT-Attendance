import { db } from '@/db/index';
import { students, teachers, divisions, academicYears, subjects } from '@/db/schema';
import { count, eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const [studentCount] = await db.select({ value: count() }).from(students);
    const [teacherCount] = await db.select({ value: count() }).from(teachers);
    const [divisionCount] = await db.select({ value: count() }).from(divisions);
    const [activeYear] = await db.select().from(academicYears).where(eq(academicYears.isActive, true)).limit(1);

    // Fetch recent activities
    const [recentStudents, recentTeachers, recentSubjects] = await Promise.all([
      db.select({ name: students.name, createdAt: students.createdAt }).from(students).orderBy(desc(students.createdAt)).limit(5),
      db.select({ name: teachers.name, createdAt: teachers.createdAt }).from(teachers).orderBy(desc(teachers.createdAt)).limit(5),
      db.select({ name: subjects.name, createdAt: subjects.createdAt }).from(subjects).orderBy(desc(subjects.createdAt)).limit(5),
    ]);

    const activities = [
      ...recentStudents.map(s => ({ title: `New Student: ${s.name}`, time: s.createdAt, type: 'student' })),
      ...recentTeachers.map(t => ({ title: `New Teacher: ${t.name}`, time: t.createdAt, type: 'teacher' })),
      ...recentSubjects.map(sub => ({ title: `New Subject: ${sub.name}`, time: sub.createdAt, type: 'subject' })),
    ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5)
    .map(act => {
      const diff = Date.now() - act.time.getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      
      let timeStr = 'Just now';
      if (days > 0) timeStr = `${days}d ago`;
      else if (hours > 0) timeStr = `${hours}h ago`;
      else if (mins > 0) timeStr = `${mins}m ago`;
      
      return {
        title: act.title,
        time: timeStr,
        type: act.type
      };
    });

    return Response.json({
      students: studentCount.value,
      teachers: teacherCount.value,
      divisions: divisionCount.value,
      activeYear: activeYear?.year || 'None Set',
      activeYearId: activeYear?.id || null,
      attendanceToday: '94%', // Placeholder
      activities: activities.length > 0 ? activities : [
        { title: 'System Initialized', time: 'Just now', type: 'system' }
      ]
    });
  } catch (error: any) {
    console.error('Stats error details:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
