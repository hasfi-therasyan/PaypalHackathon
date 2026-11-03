/**
 * Seed Demo Script
 * Populates sample pledge contracts with hash-chained ledger events
 */

async function seed() {
  const host = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`Connecting to ${host}/api/admin/seed...`);

  try {
    const res = await fetch(`${host}/api/admin/seed`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      console.log('✓ Successfully seeded demo pledges:');
      console.log(JSON.stringify(data.seeded, null, 2));
    } else {
      console.error('✗ Seed failed:', data.error);
    }
  } catch (err: any) {
    console.error('✗ Failed to execute seed:', err.message);
  }
}

seed();
