require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function main() {
  const password = 'AdminPassword123!';

  for (let i = 1; i <= 10; i++) {
    const email = `admin${i}@shehab-tech.com`;
    console.log(`Processing admin: ${email}`);

    try {
      // 1. Create or update user in Supabase Auth
      let userId;
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { first_name: 'Shehab', last_name: `Admin${i}` }
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`User ${email} already exists in Supabase. Updating password...`);
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users.users.find(u => u.email === email);
          if (existingUser) {
            userId = existingUser.id;
            await supabase.auth.admin.updateUserById(userId, { password: password });
          }
        } else {
          console.error(`Supabase Auth Error for ${email}:`, authError.message);
          continue;
        }
      } else {
        userId = authData?.user?.id;
      }

      if (!userId) {
        console.error(`Could not retrieve user ID for ${email}`);
        continue;
      }

      // 2. Create or update in Prisma
      await prisma.user.upsert({
        where: { email: email },
        update: { role: 'ADMIN', verificationStatus: 'VERIFIED' },
        create: {
          id: userId,
          email: email,
          firstName: 'Shehab',
          lastName: `Admin${i}`,
          role: 'ADMIN',
          verificationStatus: 'VERIFIED'
        }
      });

      console.log(`=== ADMIN ACCOUNT READY ===`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}\n`);
      
    } catch (err) {
      console.error(`Error processing ${email}:`, err);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
