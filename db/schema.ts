import { pgTable, uuid, text, varchar, integer, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const academicYears = pgTable('academic_years', {
  id: uuid('id').defaultRandom().primaryKey(),
  year: varchar('year', { length: 20 }).notNull(), // e.g. "2023-24"
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const divisions = pgTable('divisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(), // e.g. "CS-A"
  department: varchar('department', { length: 100 }).notNull(),
  semester: integer('semester').notNull(),
  academicYearId: uuid('academic_year_id').references(() => academicYears.id).notNull(),
  maxCapacity: integer('max_capacity'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  rollNumber: varchar('roll_number', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  department: varchar('department', { length: 100 }),
  semester: integer('semester'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const divisionStudents = pgTable('division_students', {
  divisionId: uuid('division_id').references(() => divisions.id).notNull(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.divisionId, t.studentId] }),
}));

export const teachers = pgTable('teachers', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  department: varchar('department', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  divisionId: uuid('division_id').references(() => divisions.id).notNull(),
  teacherId: uuid('teacher_id').references(() => teachers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const classSchedules = pgTable('class_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(), // e.g. "Monday"
  startTime: varchar('start_time', { length: 10 }).notNull(), // e.g. "09:00"
  endTime: varchar('end_time', { length: 10 }).notNull(), // e.g. "10:00"
  room: varchar('room', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(), // In a real app, hash this!
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  scheduleId: uuid('schedule_id').references(() => classSchedules.id).notNull(),
  date: timestamp('date').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull(), // e.g. "Present", "Absent", "Late"
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
