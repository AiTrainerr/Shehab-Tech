const { Client } = require('pg');

async function main() {
  const connectionString = "postgresql://postgres.rettlkmmznhdmdgqrhbc:ShehabTech2026%21@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    const res1 = await client.query(`SELECT count(*) FROM "ProjectSentence" WHERE "speakerCode" = 'G0274'`);
    console.log('Total sentences for G0274:', res1.rows[0].count);

    const res2 = await client.query(`SELECT count(*) FROM "ProjectSentence" WHERE "assignedUserId" = 'a45b87af-e0b4-47c5-9d53-ac64121bb9a1'`);
    console.log('abuzaidnoor assigned sentences:', res2.rows[0].count);

    const res3 = await client.query(`
      SELECT "speakerCode", count(*) 
      FROM "ProjectSentence" 
      WHERE "assignedUserId" = 'a45b87af-e0b4-47c5-9d53-ac64121bb9a1'
      GROUP BY "speakerCode"
    `);
    console.log('abuzaidnoor grouped by speakerCode:', res3.rows);
    
    const res4 = await client.query(`
      SELECT count(*) FROM "VoiceRecording" vr
      JOIN "ProjectSentence" ps ON vr."sentenceId" = ps.id
      WHERE vr."userId" = 'a45b87af-e0b4-47c5-9d53-ac64121bb9a1'
    `);
    console.log('abuzaidnoor voice recordings:', res4.rows[0].count);

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
main();
