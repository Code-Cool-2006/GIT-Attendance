require('dotenv').config();

const BASE_URL = 'http://localhost:8081';

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

async function runTeacherTests() {
  console.log('--------------------------------------------------');
  console.log('🚀 TESTING ALL TEACHER APP FEATURES');
  console.log('--------------------------------------------------\n');

  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    const ok = await testFeature(name, fn);
    if (ok) passed++;
  }

  let teacher = null;
  let classInfo = null;
  let scheduleId = null;
  let studentsList = [];
  let testSessionId = null;

  // 1. Teacher Auth Login
  await check('Teacher Auth Login (/api/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: 'CS-001', password: 'cs-001' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.teacher) {
      throw new Error(data.error || 'Teacher login failed');
    }
    teacher = data.teacher;
  });

  // 2. Teacher Assigned Classes
  await check('Teacher Classes List (/api/teacher/classes)', async () => {
    if (!teacher) throw new Error('No teacher logged in');
    const res = await fetch(`${BASE_URL}/api/teacher/classes?teacher_id=${teacher.id}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.classes)) {
      throw new Error(data.error || 'Failed to fetch teacher classes');
    }
    if (data.classes.length > 0) {
      classInfo = data.classes[0];
      if (classInfo.schedules && classInfo.schedules.length > 0) {
        scheduleId = classInfo.schedules[0].id;
      }
    }
  });

  // 3. Teacher Today Schedule
  await check("Teacher Today's Schedule (/api/teacher/schedule/today)", async () => {
    if (!teacher) throw new Error('No teacher logged in');
    const todayStr = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${BASE_URL}/api/teacher/schedule/today?teacher_id=${teacher.id}&date=${todayStr}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.classes)) {
      throw new Error(data.error || "Failed to fetch today's schedule");
    }
    if (!scheduleId && data.classes.length > 0) {
      scheduleId = data.classes[0].schedule_id;
    }
  });

  // 4. Class Students List
  await check('Class Enrolled Students (/api/teacher/classes/:classId/students)', async () => {
    const idToUse = scheduleId || (classInfo ? classInfo.subject_id : null);
    if (!idToUse) throw new Error('No schedule or class ID available');
    const res = await fetch(`${BASE_URL}/api/teacher/classes/${idToUse}/students`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.students)) {
      throw new Error(data.error || 'Failed to fetch class students');
    }
    studentsList = data.students;
  });

  // 5. Submit Attendance Session
  await check('Submit Attendance Session (POST /api/teacher/attendance)', async () => {
    if (!scheduleId) throw new Error('No schedule ID available for marking attendance');
    const todayStr = new Date().toISOString().slice(0, 10);
    const records = studentsList.map((st, idx) => ({
      student_id: st.id,
      status: idx % 2 === 0 ? 'Present' : 'Absent',
      remarks: idx % 2 === 0 ? 'On time' : 'Late',
    }));

    const res = await fetch(`${BASE_URL}/api/teacher/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedule_id: scheduleId,
        date: todayStr,
        records,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit attendance');
    }
    testSessionId = data.session_id || scheduleId;
  });

  // 6. Get Marked Attendance Session
  await check('Get Attendance Session (GET /api/teacher/attendance/:sessionId)', async () => {
    if (!testSessionId) throw new Error('No test session ID available');
    const res = await fetch(`${BASE_URL}/api/teacher/attendance/${testSessionId}`);
    const data = await res.json();
    if (!res.ok || !data.session) {
      throw new Error(data.error || 'Failed to fetch attendance session details');
    }
  });

  // 7. Update Marked Attendance Session
  await check('Update Attendance Session (PUT /api/teacher/attendance/:sessionId)', async () => {
    if (!testSessionId) throw new Error('No test session ID available');
    const updatedRecords = studentsList.map((st) => ({
      student_id: st.id,
      status: 'Present',
      remarks: 'Updated to Present',
    }));

    const res = await fetch(`${BASE_URL}/api/teacher/attendance/${testSessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: updatedRecords }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update attendance session');
    }
  });

  // 8. Attendance History
  await check('Attendance History (/api/teacher/attendance/history/:scheduleId)', async () => {
    if (!scheduleId) throw new Error('No schedule ID available');
    const res = await fetch(`${BASE_URL}/api/teacher/attendance/history/${scheduleId}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.sessions)) {
      throw new Error(data.error || 'Failed to fetch attendance history');
    }
  });

  // 9. Shortage Report
  await check('Shortage Report (/api/teacher/reports/shortage)', async () => {
    if (!teacher) throw new Error('No teacher logged in');
    const res = await fetch(`${BASE_URL}/api/teacher/reports/shortage?teacher_id=${teacher.id}&threshold=75`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.students)) {
      throw new Error(data.error || 'Failed to fetch shortage report');
    }
  });

  // 10. Class Analytics
  await check('Class Analytics (/api/teacher/analytics/:scheduleId)', async () => {
    if (!scheduleId || !teacher) throw new Error('No schedule ID or teacher available');
    const res = await fetch(`${BASE_URL}/api/teacher/analytics/${scheduleId}?teacher_id=${teacher.id}`);
    const data = await res.json();
    if (!res.ok || !data.weekly || !data.sessions) {
      throw new Error(data.error || 'Failed to fetch class analytics');
    }
  });

  console.log('\n--------------------------------------------------');
  console.log(`📊 TEACHER APP TEST RESULTS: ${passed}/${total} FEATURES WORKING PERFECTLY!`);
  console.log('--------------------------------------------------');
}

runTeacherTests();
