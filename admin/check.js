
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const code = fs.readFileSync('src/config/supabase.js', 'utf-8');
const urlMatch = code.match(/supabaseUrl\s*=\s*(['\\"])(.*?)\1/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*(['\\"])(.*?)\1/);
if(urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[2], keyMatch[2]);
  supabase.from('users').select('email, role').in('role', ['gso', 'pso', 'supply', 'venue', 'admin_assistant']).then((res) => {
    console.log(res.data);
    process.exit(0);
  });
}

