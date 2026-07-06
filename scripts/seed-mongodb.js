require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('../src/config/db');
const Staff = require('../src/models/Staff');
const Room = require('../src/models/Room');

const SAMPLE_ROOMS = [
  { room_number: '101', type: 'SINGLE', price_per_night: 80, floor: 1 },
  { room_number: '102', type: 'SINGLE', price_per_night: 80, floor: 1 },
  { room_number: '103', type: 'SINGLE', price_per_night: 80, floor: 1 },
  { room_number: '201', type: 'DOUBLE', price_per_night: 120, floor: 2 },
  { room_number: '202', type: 'DOUBLE', price_per_night: 120, floor: 2 },
  { room_number: '301', type: 'DOUBLE', price_per_night: 120, floor: 3 },
  { room_number: '401', type: 'SUITE', price_per_night: 250, floor: 4 },
  { room_number: '501', type: 'SUITE', price_per_night: 250, floor: 5 },
];

async function seed() {
  await connectDB();

  const adminHash = await bcrypt.hash('admin123', 10);
  const receptHash = await bcrypt.hash('recept123', 10);

  const staffCollection = mongoose.connection.collection('staff');
  await staffCollection.deleteMany({});
  await Staff.create({
    full_name: 'System Admin',
    email: 'admin@hotel.com',
    password_hash: adminHash,
    role: 'ADMIN',
  });
  await Staff.create({
    full_name: 'Front Desk',
    email: 'reception@hotel.com',
    password_hash: receptHash,
    role: 'RECEPTIONIST',
  });

  const roomCollection = mongoose.connection.collection('rooms');
  await roomCollection.deleteMany({});
  for (const room of SAMPLE_ROOMS) {
    await Room.create({ ...room, status: 'AVAILABLE' });
  }

  console.log('Database seeded successfully.');
  console.log('  Admin:        admin@hotel.com / admin123');
  console.log('  Receptionist: reception@hotel.com / recept123');
  console.log(`  Rooms:        ${SAMPLE_ROOMS.length} sample rooms created`);

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
