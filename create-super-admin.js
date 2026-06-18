require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@shehab-tech.com';
  const password = 'AdminPassword123!';

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { first_name: 'Super', last_name: 'Admin' }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('User already exists in Supabase. Proceeding to update password...');
        // Update password just in case
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);
        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, { password: password });
        }
      } else {
        console.error('Supabase Auth Error:', authError.message);
        return;
      }
    }

    const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email).id;

    // 2. Create or update in Prisma
    await prisma.user.upsert({
      where: { email: email },
      update: { role: 'ADMIN', verificationStatus: 'VERIFIED' },
      create: {
        id: userId,
        email: email,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMIN',
        verificationStatus: 'VERIFIED'
      }
    });

    console.log(`=== ADMIN ACCOUNT READY ===`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
