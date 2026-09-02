import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

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
    
    // Add constraints if they don't exist (using try/catch to ignore if they do)
    try {
      await sql`ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;`;
    } catch (e) {}
    
    try {
      await sql`ALTER TABLE "attendance" ADD CONSTRAINT "attendance_schedule_id_class_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE no action ON UPDATE no action;`;
    } catch (e) {}

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
