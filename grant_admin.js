const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mhcpymkawoemnqojaswi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oY3B5bWthd29lbW5xb2phc3dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc4MzA1NCwiZXhwIjoyMDg5MzU5MDU0fQ.KKWjcGHxvBzcya1G1JGkizILH6-ElYiT-3MxlZXI8rE');

async function run() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error(listError);
  const user = users.find(u => u.email === 'maironcamilovargascastellon@gmail.com');
  if (!user) return console.error('User not found');
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { app_metadata: { app_role: 'super_admin' } });
  if (updateError) return console.error(updateError);
  console.log('Granted super_admin successfully!');
}
run();
