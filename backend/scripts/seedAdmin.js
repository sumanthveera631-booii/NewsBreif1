require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not configured in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
  });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.argv[2] || 'Admin@1234';
  const adminName = 'Admin';

  try {
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`Admin user already exists: ${adminEmail}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    admin = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
    });

    await admin.save();
    console.log(`Admin user created successfully: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
