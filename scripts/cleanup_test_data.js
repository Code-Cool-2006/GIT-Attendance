const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function cleanupTestData() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    return;
  }
  const sql = neon(dbUrl);
  console.log('Cleaning up test data from Neon PostgreSQL database...\n');

  try {
    // 1. Clean up test schedules linked to test subjects
    const deletedSchedules = await sql`
      DELETE FROM class_schedules 
      WHERE subject_id IN (
        SELECT id FROM subjects WHERE code LIKE 'CS401_%' OR name = 'Database Management Systems'
      )
      RETURNING id;
    `;
    console.log(`Deleted ${deletedSchedules.length} test schedule slots.`);

    // 2. Clean up test subjects
    const deletedSubjects = await sql`
      DELETE FROM subjects 
      WHERE code LIKE 'CS401_%' OR name = 'Database Management Systems'
      RETURNING id;
    `;
    console.log(`Deleted ${deletedSubjects.length} test subjects.`);

    // 3. Clean up test student division mappings
    const deletedDivStudents = await sql`
      DELETE FROM division_students 
      WHERE student_id IN (
        SELECT id FROM students WHERE roll_number LIKE 'TEST%' OR roll_number LIKE 'TEMP%'
      ) OR division_id IN (
        SELECT id FROM divisions WHERE name = 'CS-TEST-DIV'
      )
      RETURNING student_id;
    `;
    console.log(`Deleted ${deletedDivStudents.length} test division-student associations.`);

    // 4. Clean up test attendance records
    const deletedAttendance = await sql`
      DELETE FROM attendance 
      WHERE student_id IN (
        SELECT id FROM students WHERE roll_number LIKE 'TEST%' OR roll_number LIKE 'TEMP%'
      )
      RETURNING id;
    `;
    console.log(`Deleted ${deletedAttendance.length} test attendance records.`);

    // 5. Clean up test students
    const deletedStudents = await sql`
      DELETE FROM students 
      WHERE roll_number LIKE 'TEST%' OR roll_number LIKE 'TEMP%'
      RETURNING id;
    `;
    console.log(`Deleted ${deletedStudents.length} test student records.`);

    // 6. Clean up test teachers
    const deletedTeachers = await sql`
      DELETE FROM teachers 
      WHERE employee_id LIKE 'EMP_TEST%' OR name LIKE '%Test Teacher%'
      RETURNING id;
    `;
    console.log(`Deleted ${deletedTeachers.length} test teacher records.`);

    // 7. Clean up test divisions
    const deletedDivisions = await sql`
      DELETE FROM divisions 
      WHERE name = 'CS-TEST-DIV'
      RETURNING id;
    `;
    console.log(`Deleted ${deletedDivisions.length} test division records.`);

    // 8. Clean up test academic years
    const deletedAYs = await sql`
      DELETE FROM academic_years 
      WHERE year = '2025-26'
      RETURNING id;
    `;
    console.log(`Deleted ${deletedAYs.length} test academic year records.`);

    console.log('\n✅ Cleanup complete! All test data removed cleanly.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupTestData();
