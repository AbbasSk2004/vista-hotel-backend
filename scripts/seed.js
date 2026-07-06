require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function seed() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const receptHash = await bcrypt.hash('recept123', 10);

  await pool.query(
    `UPDATE staff SET password_hash = $1 WHERE email = 'admin@hotel.com'`,
    [adminHash]
  );
  await pool.query(
    `UPDATE staff SET password_hash = $1 WHERE email = 'reception@hotel.com'`,
    [receptHash]
  );

  console.log('Staff passwords updated: admin123 / recept123');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
