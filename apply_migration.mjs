import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Applying migration...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "attendance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL,
        "schedule_id" uuid NOT NULL,
        "date" timestamp DEFAULT now() NOT NULL,
        "status" varchar(20) NOT NULL,
        "remarks" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    
    console.log('Table created or exists.');

    try {
      await sql`ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE no action ON UPDATE no action;`;
      console.log('Student FK added.');
    } catch (e) {
      console.log('Student FK already exists or error:', e.message);
    }
    
    try {
      await sql`ALTER TABLE "attendance" ADD CONSTRAINT "attendance_schedule_id_class_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "class_schedules"("id") ON DELETE no action ON UPDATE no action;`;
      console.log('Schedule FK added.');
    } catch (e) {
      console.log('Schedule FK already exists or error:', e.message);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
