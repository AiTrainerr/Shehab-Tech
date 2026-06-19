require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

const moderators = [
  { email: 'mod1@shehab-tech.com', firstName: 'Mod', lastName: 'One' },
  { email: 'mod2@shehab-tech.com', firstName: 'Mod', lastName: 'Two' },
  { email: 'mod3@shehab-tech.com', firstName: 'Mod', lastName: 'Three' },
  { email: 'mod4@shehab-tech.com', firstName: 'Mod', lastName: 'Four' },
  { email: 'mod5@shehab-tech.com', firstName: 'Mod', lastName: 'Five' },
];

const DEFAULT_PASSWORD = 'ModPassword2026!';

async function main() {
  for (const mod of moderators) {
    try {
      console.log(`Creating moderator ${mod.email}...`);
      
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: mod.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: mod.firstName, last_name: mod.lastName }
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`User ${mod.email} already exists in Supabase. Updating password...`);
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users.users.find(u => u.email === mod.email);
          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, { password: DEFAULT_PASSWORD });
          }
        } else {
          console.error(`Supabase Auth Error for ${mod.email}:`, authError.message);
          continue;
        }
      }

      const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === mod.email).id;

      // 2. Create or update in Prisma with isApproved: false
      await prisma.user.upsert({
        where: { email: mod.email },
        update: { 
          role: 'MODERATOR', 
          isApproved: false,
          verificationStatus: 'VERIFIED'
        },
        create: {
          id: userId,
          email: mod.email,
          firstName: mod.firstName,
          lastName: mod.lastName,
          role: 'MODERATOR',
          isApproved: false,
          verificationStatus: 'VERIFIED'
        }
      });

      console.log(`✓ Moderator ${mod.email} created successfully.`);
    } catch (err) {
      console.error(`Error creating ${mod.email}:`, err);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
