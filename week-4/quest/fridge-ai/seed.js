require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seed() {
  const dir = path.join(__dirname, 'ingredients');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  const rows = files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    return JSON.parse(raw);
  });

  if (rows.length === 0) {
    console.log('No ingredient files found.');
    return;
  }

  const { data, error } = await supabase
    .from('ingredients')
    .insert(rows)
    .select();

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Inserted ${data.length} ingredients:`);
  data.forEach((row) => console.log(`  - ${row.name} (${row.quantity}, ${row.category})`));
}

seed();
