const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xyclopokakqynnjxemrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Y2xvcG9rYWtxeW5uanhlbXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzczNDMsImV4cCI6MjA5NzQ1MzM0M30.xTh50F64-1Broftt77hmuB9_eafIL36q0LochocbPJA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getAllAccounts() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, office_name')
    .order('role', { ascending: true });

  if (error) {
    console.error('Error fetching accounts:', error);
    return;
  }

  console.log('\n=== ALL STUDENT NEXUS ACCOUNTS ===\n');
  const roles = [...new Set(data.map(u => u.role))];
  
  roles.forEach(role => {
    console.log(`[ ${role.toUpperCase()} ]`);
    const roleUsers = data.filter(u => u.role === role);
    roleUsers.forEach(u => {
      let info = `  - ${u.email} | ${u.full_name}`;
      if (u.office_name) info += ` | Office: ${u.office_name}`;
      console.log(info);
    });
    console.log('');
  });
}

getAllAccounts();
