const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybercrime_tracker';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@cybercrime.local' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@cybercrime.local');
      console.log('You can change the password or create a new user.');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@cybercrime.local',
      password: 'admin123', // Will be hashed automatically
      full_name: 'System Administrator',
      role: 'admin',
      is_active: true,
      is_verified: true,
      permissions: [
        'attacks:read',
        'attacks:write',
        'attacks:update',
        'attacks:delete',
        'ips:read',
        'ips:write',
        'ips:update',
        'ips:delete',
        'users:read',
        'users:write',
        'users:update',
        'users:delete',
        'reports:read',
        'reports:write',
        'reports:delete',
        'alerts:read',
        'alerts:write',
        'alerts:update',
        'alerts:delete',
        'sources:read',
        'sources:write',
        'sources:update',
        'sources:delete'
      ]
    });

    await admin.save();
    
    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: admin@cybercrime.local');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\nYou can now login at http://localhost:3000');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();

