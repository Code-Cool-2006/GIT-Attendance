# 🛡️ Admin App — Attendance Management System

## Overview

The Admin App is the control center of the Attendance Management System. It allows administrators to manage the institution's structure — creating divisions, enrolling students, assigning them to divisions, and overseeing the full academic setup.

---

## Target Users

- **Institution Administrators** (HODs, Registrars, Office Staff)
- Single superuser role with full CRUD permissions

---

## Core Features

### 1. Dashboard
- Overview cards: Total Students, Total Divisions, Total Teachers, Active Academic Year
- Quick-action buttons: Add Student, Create Division, Assign Teacher

### 2. Division Management
- Create, edit, delete Divisions (e.g., CS-A, CS-B, ECE-A)
- Fields: Division Name, Department, Semester, Academic Year, Max Capacity
- View students assigned to each division

### 3. Student Management
- Add students manually or bulk-import via CSV
- Fields: Name, Roll Number, Email, Phone, Department, Semester
- Assign students to a Division
- Reassign or remove students from divisions

### 4. Teacher Management
- Add teachers with their profile
- Fields: Name, Employee ID, Email, Department, Subjects handled
- Assign teachers to classes/subjects for a division

### 5. Subject & Class Management
- Create subjects linked to a division
- Schedule classes: Day, Time Slot, Subject, Teacher, Room
- View full timetable per division

### 6. Academic Year & Semester Setup
- Define academic years and semesters
- Mark active semester
- Rollover: archive old data and initialize new semester

### 7. Reports (Admin View)
- Division-wise attendance summary
- Teacher-wise class conduction report
- Export reports as CSV / PDF

---

## User Flows

### Flow 1: Create a Division & Assign Students
1. Go to **Divisions** → Click **New Division**
2. Fill: Name, Department, Semester, Year → Save
3. Go to **Students** → Select students → Assign to Division

### Flow 2: Set Up a Class Schedule
1. Go to **Subjects** → Add Subject → Link to Division + Teacher
2. Go to **Schedule** → Add class slots per day of week
3. Teachers and students can now see their respective timetables

---

## Tech Stack Recommendations

| Layer | Tech |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Auth | Clerk / NextAuth (Admin role only) |
| Backend | Next.js API Routes or Express |
| Database | Neon (PostgreSQL) |
| File Upload | CSV parsing via `papaparse` |

---

## Neon DB Tables Used

- `academic_years`
- `divisions`
- `students`
- `teachers`
- `subjects`
- `class_schedules`
- `division_students` (join table)

> See **neon-db-guide.md** for full schema.

---

## API Endpoints (Admin)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/divisions` | List all divisions |
| POST | `/api/admin/divisions` | Create division |
| PUT | `/api/admin/divisions/:id` | Update division |
| DELETE | `/api/admin/divisions/:id` | Delete division |
| GET | `/api/admin/students` | List all students |
| POST | `/api/admin/students` | Add student |
| POST | `/api/admin/students/assign` | Assign student to division |
| GET | `/api/admin/teachers` | List all teachers |
| POST | `/api/admin/subjects` | Create subject |
| POST | `/api/admin/schedules` | Create class schedule |
| GET | `/api/admin/reports` | Get attendance summary |

---

## UI Screens

1. **Login Page** — Admin credentials
2. **Dashboard** — Stats + Quick actions
3. **Divisions Page** — List + Create/Edit modal
4. **Students Page** — Table with search/filter + Bulk assign
5. **Teachers Page** — Card grid + Add teacher form
6. **Subjects & Schedule Page** — Timetable grid view
7. **Reports Page** — Charts + Export options

---

## Access Control

- Only authenticated admins can access this app
- No student or teacher can access admin routes
- All API routes protected by middleware role-check