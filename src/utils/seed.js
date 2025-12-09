require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Seat = require('../models/Seat');

const connectDB = require('../config/database');

// Seed data
const users = [
  {
    name: 'Admin User',
    email: 'admin@aboor.sa',
    phone: '0500000001',
    nationalId: '1000000001',
    password: 'admin123',
    role: 'admin',
    isActive: true
  },
  {
    name: 'وليد الزهراني',
    email: 'waleed@example.com',
    phone: '0500000000',
    nationalId: '1234567890',
    password: 'password123',
    favoriteTeam: 'الاتفاق',
    role: 'user',
    isActive: true
  },
  {
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '0501111111',
    nationalId: '1111111111',
    password: 'password123',
    favoriteTeam: 'الهلال',
    role: 'user',
    isActive: true
  },
  {
    name: 'فيصل العتيبي',
    email: 'faisal@example.com',
    phone: '0502222222',
    nationalId: '2222222222',
    password: 'password123',
    favoriteTeam: 'النصر',
    role: 'user',
    isActive: true
  }
];

const matches = [
  {
    homeTeam: 'الأهلي',
    homeTeamIcon: '🟢',
    homeTeamLogo: '/Alahli.png',
    awayTeam: 'الهلال',
    awayTeamIcon: '🌙',
    awayTeamLogo: '/alhilal.png',
    date: new Date('2026-02-17'),
    time: '21:00',
    stadium: 'Red Arena',
    basePrice: 50,
    status: 'upcoming'
  },
  {
    homeTeam: 'الاتفاق',
    homeTeamIcon: '🔵',
    homeTeamLogo: '/%20Al-Ettifaq.png',
    awayTeam: 'الاتحاد',
    awayTeamIcon: '⚽',
    awayTeamLogo: '/Al-Ittihad.png',
    date: new Date('2026-03-02'),
    time: '20:30',
    stadium: 'Green Arena',
    basePrice: 75,
    status: 'upcoming'
  },
  {
    homeTeam: 'النصر',
    homeTeamIcon: '🟡',
    homeTeamLogo: '/Al-Nassr.png',
    awayTeam: 'الشباب',
    awayTeamIcon: '⚡',
    awayTeamLogo: '/AlShabab.png',
    date: new Date('2026-04-10'),
    time: '19:00',
    stadium: 'Blue Arena',
    basePrice: 60,
    status: 'upcoming'
  },
  {
    homeTeam: 'الهلال',
    homeTeamIcon: '🌙',
    homeTeamLogo: '/alhilal.png',
    awayTeam: 'النصر',
    awayTeamIcon: '🟡',
    awayTeamLogo: '/Al-Nassr.png',
    date: new Date('2026-05-15'),
    time: '21:30',
    stadium: 'King Fahd Stadium',
    basePrice: 100,
    status: 'upcoming'
  },
  {
    homeTeam: 'الاتحاد',
    homeTeamIcon: '⚽',
    homeTeamLogo: '/Al-Ittihad.png',
    awayTeam: 'الأهلي',
    awayTeamIcon: '🟢',
    awayTeamLogo: '/Alahli.png',
    date: new Date('2026-06-20'),
    time: '20:00',
    stadium: 'King Abdullah Sports City',
    basePrice: 80,
    status: 'upcoming'
  }
];

// Area numbers from frontend
const areaNumbers = [
  '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', 
  '114', '115', '116', '119', '120', '121', '125', '126', '130', '131',
  '132', '133', '134', '135', '136', '137', '138', '139', '140',
  '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
  '211', '212', '213', '214', '215', '216', '217', '218', '219', '220',
  '221', '222', '223', '224', '225', '226'
];

const zones = ['Red', 'Yellow', 'Green', 'Blue', 'Pink', 'Orange', 'Cyan'];

// Create seats for a match
const createSeats = async (matchId) => {
  const seats = [];
  
  for (const zone of zones) {
    for (const areaNumber of areaNumbers) {
      seats.push({
        matchId,
        zone,
        areaNumber,
        isAvailable: true
      });
    }
  }

  await Seat.insertMany(seats);
  
  // Update match with seat counts
  await Match.findByIdAndUpdate(matchId, {
    totalSeats: seats.length,
    availableSeats: seats.length
  });

  return seats.length;
};

// Seed database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Match.deleteMany({});
    await Seat.deleteMany({});

    // Create users (one by one to trigger pre-save hooks for password hashing)
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create matches
    console.log('⚽ Creating matches...');
    const createdMatches = await Match.insertMany(matches);
    console.log(`✅ Created ${createdMatches.length} matches`);

    // Create seats for each match
    console.log('💺 Creating seats...');
    let totalSeats = 0;
    for (const match of createdMatches) {
      const seatCount = await createSeats(match._id);
      totalSeats += seatCount;
      console.log(`  ✓ Created ${seatCount} seats for ${match.homeTeam} vs ${match.awayTeam}`);
    }
    console.log(`✅ Created ${totalSeats} total seats`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📝 Test Accounts:');
    console.log('   Admin:');
    console.log('   Email: admin@aboor.sa');
    console.log('   Password: admin123\n');
    console.log('   User:');
    console.log('   Email: waleed@example.com');
    console.log('   Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();


