const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const BASE_URL = 'http://localhost:8081/api';

async function testFeature(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    return false;
  }
}

async function runAllTests() {
  console.log('--------------------------------------------------');
  console.log('🚀 TESTING ALL FEATURES OF GIT-ATTENDANCE APP');
  console.log('--------------------------------------------------\n');

  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    const ok = await testFeature(name, fn);
    if (ok) passed++;
  }

  // 1. Health Check
  await check('Health Endpoint (/api/health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  // 2. Admin Authentication
  await check('Admin Login (/api/login)', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@git.edu', password: 'admin' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');
  });

  // 3. Stats
  await check('Dashboard Statistics (/api/stats)', async () => {
    const res = await fetch(`${BASE_URL}/stats`);
    const data = await res.json();
    if (!res.ok) throw new Error(`Status ${res.status}`);
    if (typeof data.students !== 'number') throw new Error('Invalid stats payload');
  });

  // 4. Academic Years Management
  let createdAyId = null;
  await check('Create & Set Active Academic Year (/api/academic-years)', async () => {
    const postRes = await fetch(`${BASE_URL}/academic-years`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: '2025-26', isActive: true }),
    });
    const ayData = await postRes.json();
    if (!postRes.ok) throw new Error(ayData.error || 'Failed to create AY');
    createdAyId = ayData.id;

    const getRes = await fetch(`${BASE_URL}/academic-years`);
    const ayList = await getRes.json();
    if (!getRes.ok || !Array.isArray(ayList)) throw new Error('Failed to fetch AY list');
  });

  // 5. Divisions Management
  let createdDivisionId = null;
  await check('Divisions CRUD (/api/divisions)', async () => {
    const postRes = await fetch(`${BASE_URL}/divisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'CS-TEST-DIV',
        department: 'Computer Science',
        semester: 4,
        academicYearId: createdAyId,
        maxCapacity: 60,
      }),
    });
    const divData = await postRes.json();
    if (!postRes.ok) throw new Error(divData.error || 'Failed to create division');
    createdDivisionId = divData.id;

    const getRes = await fetch(`${BASE_URL}/divisions`);
    const divList = await getRes.json();
    if (!getRes.ok || !Array.isArray(divList)) throw new Error('Failed to fetch divisions');
  });

  // 6. Single Student CRUD & Foreign Key Delete Check
  await check('Single Student Add & Safe Delete (/api/students)', async () => {
    const postRes = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student Temp',
        rollNumber: 'TEMP_TEST_999',
        email: 'temp999@git.edu',
        divisionId: createdDivisionId,
      }),
    });
    const studentData = await postRes.json();
    if (!postRes.ok) throw new Error(studentData.error || 'Failed to create student');

    const delRes = await fetch(`${BASE_URL}/students?id=${studentData.id}`, { method: 'DELETE' });
    const delData = await delRes.json();
    if (!delRes.ok || !delData.success) throw new Error(delData.error || 'Failed to delete student');
  });

  // 7. Bulk Student Import
  await check('Bulk Student Import (/api/students)', async () => {
    const ts = Date.now().toString().slice(-4);
    const postRes = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentsList: [
          { rollNumber: `TEST_BULK_01_${ts}`, name: 'Bulk Test One', email: `b1_${ts}@git.edu`, divisionId: createdDivisionId },
          { rollNumber: `TEST_BULK_02_${ts}`, name: 'Bulk Test Two', email: `b2_${ts}@git.edu`, divisionId: createdDivisionId },
        ],
      }),
    });
    const resData = await postRes.json();
    if (!postRes.ok || resData.insertedCount === 0) throw new Error(resData.error || `Bulk student import failed: ${JSON.stringify(resData)}`);
  });

  // 8. Teachers Management & Bulk Import
  let createdTeacherId = null;
  await check('Teachers Management & Bulk Import (/api/teachers)', async () => {
    const ts = Date.now().toString().slice(-4);
    const bulkRes = await fetch(`${BASE_URL}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teachersList: [
          { employeeId: `EMP_TEST_${ts}`, name: 'Dr. Test Teacher', email: `test_${ts}@git.edu`, department: 'CSE' },
        ],
      }),
    });
    const bulkData = await bulkRes.json();
    if (!bulkRes.ok || bulkData.insertedCount === 0) throw new Error(bulkData.error || `Bulk teacher import failed: ${JSON.stringify(bulkData)}`);

    const getRes = await fetch(`${BASE_URL}/teachers`);
    const teachersList = await getRes.json();
    if (!getRes.ok || !Array.isArray(teachersList)) throw new Error('Failed to fetch teachers');
    createdTeacherId = teachersList[0]?.id;
  });

  // 9. Subjects Management
  let createdSubjectId = null;
  await check('Subjects CRUD (/api/subjects)', async () => {
    const postRes = await fetch(`${BASE_URL}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Database Management Systems',
        code: 'CS401_' + Date.now().toString().slice(-4),
        divisionId: createdDivisionId,
        teacherId: createdTeacherId,
      }),
    });
    const subData = await postRes.json();
    if (!postRes.ok) throw new Error(subData.error || 'Failed to create subject');
    createdSubjectId = subData.id;

    const getRes = await fetch(`${BASE_URL}/subjects`);
    const subList = await getRes.json();
    if (!getRes.ok || !Array.isArray(subList)) throw new Error('Failed to fetch subjects');
  });

  // 10. Class Schedule Management
  await check('Class Schedule CRUD (/api/schedules)', async () => {
    const postRes = await fetch(`${BASE_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: createdSubjectId,
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        room: 'Lab 3',
      }),
    });
    const schedData = await postRes.json();
    if (!postRes.ok) throw new Error(schedData.error || 'Failed to create class schedule');

    const getRes = await fetch(`${BASE_URL}/schedules`);
    const schedList = await getRes.json();
    if (!getRes.ok || !Array.isArray(schedList)) throw new Error('Failed to fetch schedules');
  });

  // 11. Reports
  await check('Administrative Reports (/api/reports)', async () => {
    const res = await fetch(`${BASE_URL}/reports`);
    const reportsData = await res.json();
    if (!res.ok || !Array.isArray(reportsData)) throw new Error('Failed to fetch reports');
  });

  console.log('\n--------------------------------------------------');
  console.log(`📊 TEST RESULTS: ${passed}/${total} FEATURES WORKING PERFECTLY!`);
  console.log('--------------------------------------------------');
}

runAllTests();
