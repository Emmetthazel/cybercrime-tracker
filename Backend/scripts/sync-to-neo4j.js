require('dotenv').config();
const { MongoClient } = require('mongodb');
const { connectNeo4j } = require('../../Configuration/config/neo4j');
const graphSyncService = require('../services/graphSyncService');
const config = require('../../Configuration/config/config');

// Import models for ObjectId conversion
const Attack = require('../models/Attack');
const IP = require('../models/IP');
const User = require('../models/User');

/**
 * Sync all MongoDB data to Neo4j
 * This script syncs existing data from MongoDB to Neo4j graph database
 * Uses native MongoDB driver to avoid Mongoose buffering issues
 */
async function syncAllToNeo4j() {
  let mongoClient = null;
  
  try {
    console.log('🚀 Starting MongoDB to Neo4j sync...\n');

    // Connect to MongoDB using native driver (avoids Mongoose buffering)
    console.log('📊 Connecting to MongoDB (native driver)...');
    mongoClient = new MongoClient(config.MONGODB_URI || 'mongodb://localhost:27017/cybercrime_tracker');
    await mongoClient.connect();
    const db = mongoClient.db('cybercrime_tracker');
    console.log('✅ MongoDB connected\n');

    // Connect to Neo4j
    console.log('🔗 Connecting to Neo4j...');
    await connectNeo4j();
    console.log('✅ Neo4j connected\n');

    // Sync Users first (they are referenced by other entities)
    console.log('👥 Syncing Users...');
    const userDocs = await db.collection('users').find({}).toArray();
    console.log(`   Found ${userDocs.length} users`);
    
    let userCount = 0;
    for (const userDoc of userDocs) {
      try {
        // Convert to format expected by sync service
        const user = {
          ...userDoc,
          _id: userDoc._id // Keep MongoDB ObjectId
        };
        await graphSyncService.syncUser(user);
        userCount++;
        if (userCount % 10 === 0) {
          process.stdout.write(`\r   Synced ${userCount}/${userDocs.length} users...`);
        }
      } catch (error) {
        console.error(`\n   Error syncing user ${userDoc._id}:`, error.message);
      }
    }
    console.log(`\n✅ Synced ${userCount}/${userDocs.length} users\n`);

    // Sync IPs
    console.log('🌐 Syncing IPs...');
    const ipDocs = await db.collection('ips').find({}).toArray();
    console.log(`   Found ${ipDocs.length} IPs`);
    
    let ipCount = 0;
    for (const ipDoc of ipDocs) {
      try {
        const ip = {
          ...ipDoc,
          _id: ipDoc._id
        };
        await graphSyncService.syncIP(ip);
        ipCount++;
        if (ipCount % 10 === 0) {
          process.stdout.write(`\r   Synced ${ipCount}/${ipDocs.length} IPs...`);
        }
      } catch (error) {
        console.error(`\n   Error syncing IP ${ipDoc._id}:`, error.message);
      }
    }
    console.log(`\n✅ Synced ${ipCount}/${ipDocs.length} IPs\n`);

    // Sync Attacks (with relationships)
    console.log('⚔️  Syncing Attacks...');
    const attackDocs = await db.collection('attacks').find({}).toArray();
    console.log(`   Found ${attackDocs.length} attacks`);
    
    let attackCount = 0;
    for (const attackDoc of attackDocs) {
      try {
        const attack = {
          ...attackDoc,
          _id: attackDoc._id,
          // Keep ObjectId references as-is
          source_ip_ref: attackDoc.source_ip_ref || null,
          reported_by: attackDoc.reported_by || null,
          assigned_to: attackDoc.assigned_to || null,
          related_attacks: attackDoc.related_attacks || [],
          related_vulnerabilities: attackDoc.related_vulnerabilities || [],
          related_indicators: attackDoc.related_indicators || []
        };
        await graphSyncService.syncAttack(attack);
        attackCount++;
        if (attackCount % 10 === 0) {
          process.stdout.write(`\r   Synced ${attackCount}/${attackDocs.length} attacks...`);
        }
      } catch (error) {
        console.error(`\n   Error syncing attack ${attackDoc._id}:`, error.message);
      }
    }
    console.log(`\n✅ Synced ${attackCount}/${attackDocs.length} attacks\n`);

    // Sync IP associations (same ASN, same organization)
    console.log('🔗 Syncing IP Associations...');
    let associationCount = 0;
    
    // Group IPs by ASN
    const ipsByASN = {};
    for (const ip of ipDocs) {
      if (ip.asn) {
        if (!ipsByASN[ip.asn]) {
          ipsByASN[ip.asn] = [];
        }
        ipsByASN[ip.asn].push(ip);
      }
    }

    // Create associations for IPs with same ASN
    for (const [asn, ipList] of Object.entries(ipsByASN)) {
      if (ipList.length > 1) {
        for (let i = 0; i < ipList.length; i++) {
          for (let j = i + 1; j < ipList.length; j++) {
            try {
              await graphSyncService.syncIPAssociation(ipList[i], ipList[j], 'same_asn');
              associationCount++;
            } catch (error) {
              console.error(`   Error syncing IP association:`, error.message);
            }
          }
        }
      }
    }
    console.log(`✅ Created ${associationCount} IP associations\n`);

    console.log('✅ Sync completed successfully!\n');
    console.log('Summary:');
    console.log(`  Users: ${userCount}`);
    console.log(`  IPs: ${ipCount}`);
    console.log(`  Attacks: ${attackCount}`);
    console.log(`  IP Associations: ${associationCount}`);

    // Close connections
    await mongoClient.close();
    const { closeNeo4j } = require('../../Configuration/config/neo4j');
    await closeNeo4j();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch (e) {
        // Ignore
      }
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  syncAllToNeo4j();
}

module.exports = syncAllToNeo4j;
