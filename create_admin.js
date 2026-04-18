const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mldmjwcdefamhtoukddq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZG1qd2NkZWZhbWh0b3VrZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTUxMjQsImV4cCI6MjA5MjAzMTEyNH0.3Yi6K5xmNZm39LKn1VhYzO9NrPzWX3ni-4HL0SpZim8');

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'paulormorpheus21@gmail.com',
    password: '42@camuPC483783',
    options: {
      data: {
        full_name: 'Paulo Morpheus',
        username: 'paulormorpheus',
        house: 'slytherin'
      }
    }
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('User created:', data.user.id);
  }
}

createUser();
