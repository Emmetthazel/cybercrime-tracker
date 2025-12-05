const mongoose = require('mongoose');
const Attack = require('../models/Attack');
const IP = require('../models/IP');
const User = require('../models/User');
require('dotenv').config();

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybercrime_tracker';
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get admin user for reporting
    const adminUser = await User.findOne({ email: 'admin@cybercrime.local' });
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run: .\\create-first-user.ps1');
      process.exit(1);
    }

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\n🧹 Clearing existing data...');
    await Attack.deleteMany({});
    await IP.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create sample IPs
    console.log('\n📡 Creating sample IPs...');
    const sampleIPs = [
      {
        ip_address: '185.122.54.90',
        country: 'Russia',
        country_code: 'RU',
        city: 'Moscow',
        isp: 'Evil Corp ISP',
        threat_score: 85,
        attack_count: 12,
        is_blacklisted: true,
        attack_types: ['Phishing', 'Malware Distribution'],
        malware_families: ['Emotet', 'TrickBot'],
        first_seen: new Date('2024-01-15'),
        last_activity: new Date()
      },
      {
        ip_address: '103.212.45.90',
        country: 'China',
        country_code: 'CN',
        city: 'Beijing',
        isp: 'Suspicious Hosting',
        threat_score: 78,
        attack_count: 8,
        is_blacklisted: true,
        attack_types: ['DDoS', 'Brute Force'],
        first_seen: new Date('2024-02-01'),
        last_activity: new Date()
      },
      {
        ip_address: '192.168.1.100',
        country: 'United States',
        country_code: 'US',
        city: 'New York',
        isp: 'Unknown',
        threat_score: 45,
        attack_count: 3,
        is_blacklisted: false,
        attack_types: ['Phishing'],
        first_seen: new Date('2024-03-10'),
        last_activity: new Date()
      }
    ];

    const createdIPs = await IP.insertMany(sampleIPs);
    console.log(`✅ Created ${createdIPs.length} IPs`);

    // Create sample attacks
    console.log('\n⚔️  Creating sample attacks...');
    const attackTypes = ['Phishing', 'DDoS', 'Ransomware', 'Malware', 'SQL Injection', 'XSS'];
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    const statuses = ['Detected', 'Under Investigation', 'Contained', 'Mitigated', 'Resolved'];
    const countries = ['Morocco', 'United States', 'France', 'Germany', 'United Kingdom', 'Spain'];
    const sectors = ['Education', 'Finance', 'Healthcare', 'Government', 'Technology'];

    const sampleAttacks = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
      const attackDate = new Date(now);
      attackDate.setDate(attackDate.getDate() - daysAgo);
      
      const type = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const targetCountry = countries[Math.floor(Math.random() * countries.length)];
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      
      // Pick a random IP
      const sourceIP = createdIPs[Math.floor(Math.random() * createdIPs.length)];

      const attack = {
        type: type,
        subtype: type === 'Phishing' ? 'Spear Phishing' : null,
        source_ip: sourceIP.ip_address,
        source_ip_ref: sourceIP._id,
        source_country: sourceIP.country,
        target_country: targetCountry,
        target_org: `Organization ${i + 1}`,
        target_sector: sector,
        date: attackDate,
        detected_at: new Date(attackDate.getTime() + 5 * 60 * 1000), // 5 minutes later
        severity: severity,
        severity_score: severity === 'Critical' ? 9.5 : severity === 'High' ? 7.5 : severity === 'Medium' ? 5.5 : 3.5,
        description: `${type} attack detected targeting ${targetCountry} ${sector} sector`,
        status: status,
        priority: severity,
        reported_by: adminUser._id,
        reported_at: attackDate,
        verified: Math.random() > 0.3, // 70% verified
        financial_impact: severity === 'Critical' ? Math.floor(Math.random() * 100000) : 
                         severity === 'High' ? Math.floor(Math.random() * 50000) :
                         severity === 'Medium' ? Math.floor(Math.random() * 10000) : 
                         Math.floor(Math.random() * 1000),
        affected_users: Math.floor(Math.random() * 5000),
        tags: [type.toLowerCase().replace(' ', '_'), sector.toLowerCase()],
        source: Math.random() > 0.5 ? 'Manual Report' : 'API Sync',
        created_at: attackDate,
        updated_at: attackDate
      };

      sampleAttacks.push(attack);
    }

    const createdAttacks = await Attack.insertMany(sampleAttacks);
    console.log(`✅ Created ${createdAttacks.length} attacks`);

    // Update IP attack counts
    console.log('\n📊 Updating IP statistics...');
    for (const ip of createdIPs) {
      const attackCount = await Attack.countDocuments({ source_ip: ip.ip_address });
      ip.attack_count = attackCount;
      await ip.save();
    }
    console.log('✅ Updated IP statistics');

    // Create a sample alert
    console.log('\n🚨 Creating sample alerts...');
    const Alert = require('../models/Alert');
    const sampleAlert = new Alert({
      title: 'High Severity Attack Detected',
      alert_type: 'High Severity',
      severity: 'High',
      description: 'Multiple high-severity attacks detected in the last 24 hours',
      source_type: 'Attack',
      source_id: createdAttacks[0]._id,
      source_model: 'Attack',
      status: 'Active',
      created_at: new Date()
    });
    await sampleAlert.save();
    console.log('✅ Created sample alert');

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${createdIPs.length} IPs created`);
    console.log(`   - ${createdAttacks.length} attacks created`);
    console.log(`   - 1 alert created`);
    console.log('\n🎉 You can now refresh the dashboard to see the data!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();

