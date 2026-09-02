const fs = require('fs');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const rawData = `Dr. Rudragoud S.Patil	
Dr. Vijay S. Rajpurohit	
Dr. Pavan N.Kunchur	
Dr.Sanjeev S. Sannakki	
Dr. Sharada M. Kori	
Dr. Aijazahamed Qazi	
Dr. Kavita D.Hanabaratti	
Dr. Prasad M.Pujar	
Dr. Ranjana Battur	
Dr. Ravi Kalkundri	
Prof. Amruta Deshpande	
Dr. Arati.S.Shahapukar	
Prof. Girish R. Deshpande	
Prof. Jyoti Amboji	
Prof. Namitha S. Bhat	
Prof. Pankaja S. Kadalagi 	
Prof. Parimal V.Tergundi	
Prof. Raghavendra Jadhav	
Prof. Seena Kalghatgi	
Prof. Shubhada S.Kulkarni	
Prof. Sudha V. Salake	
Prof. Veena V. Kangralkar	
Prof. Vidyadheesh Pandurangi	
Prof. Pavan Koralhalli	
Dr. Vijaylaxmi Rao	
Prof. Poonam Sidarkar	
Prof. Tejashree Patil	
Prof. Sagar Talagatti	
Prof.  Soumya Benakatti	
Prof. Mahalaxmi Bellubbi	
Prof. Pallavi Gundkal	
Prof. Venkatesh Patil	
Prof. Pratik J Deshpande	
Prof. Prasad M Mathapati	
Prof. Keerti P Neeralgimath	
Prof. Nandini C.V	
Prof. Madhuri Patil`;

const lines = rawData.trim().split('\n');
const csvLines = ['Employee ID, Name, Email, Department'];
const dbRows = [];

lines.forEach((line, index) => {
  const name = line.trim();
  if (name) {
    const empId = `EMP${String(index + 1).padStart(3, '0')}`;
    const cleanName = name.replace(/^(Dr\.|Prof\.|Dr\.S)\s*/i, '').trim();
    const emailName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${emailName}@git.edu`;
    const dept = 'Computer Science & Engineering';

    csvLines.push(`${empId}, "${name}", ${email}, "${dept}"`);
    dbRows.push({ empId, name, email, dept });
  }
});

fs.writeFileSync('./teachers_list.csv', csvLines.join('\n'));
console.log(`Generated teachers_list.csv with ${dbRows.length} professors!`);

async function seedDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('No DATABASE_URL found in .env, skipping DB seed.');
    return;
  }
  const sql = neon(dbUrl);
  let count = 0;
  for (const t of dbRows) {
    try {
      await sql`
        INSERT INTO teachers (id, employee_id, name, email, department)
        VALUES (gen_random_uuid(), ${t.empId}, ${t.name}, ${t.email}, ${t.dept})
        ON CONFLICT (employee_id) DO NOTHING;
      `;
      count++;
    } catch (e) {
      console.error(`Failed to insert teacher ${t.empId}:`, e.message);
    }
  }
  console.log(`Successfully seeded ${count} professors into Neon database!`);
}

seedDatabase();
