/**
 * Script pour démarrer l'ingestion automatique d'incidents depuis les APIs de Threat Intelligence
 * 
 * Usage:
 *   node scripts/start-automatic-ingestion.js
 *   node scripts/start-automatic-ingestion.js --interval 30  (30 minutes)
 */

require('dotenv').config();
const connectDB = require('../../Configuration/config/db');
const threatIntelIngestionService = require('../services/threatIntelIngestionService');

const INTERVAL_MINUTES = process.argv.includes('--interval') 
  ? parseInt(process.argv[process.argv.indexOf('--interval') + 1]) || 60
  : 60;

async function start() {
  try {
    console.log('🚀 Starting Threat Intelligence Automatic Ingestion Service...\n');
    
    // Connecter à MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Démarrer l'ingestion automatique
    await threatIntelIngestionService.startAutomaticIngestion(INTERVAL_MINUTES);
    
    console.log(`✅ Automatic ingestion started (interval: ${INTERVAL_MINUTES} minutes)`);
    console.log('📊 The service will automatically sync all active Threat Intelligence sources');
    console.log('⏹️  Press Ctrl+C to stop\n');
    
    // Gérer l'arrêt propre
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  Stopping automatic ingestion service...');
      threatIntelIngestionService.stopAutomaticIngestion();
      console.log('✅ Service stopped');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n\n⏹️  Stopping automatic ingestion service...');
      threatIntelIngestionService.stopAutomaticIngestion();
      console.log('✅ Service stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error starting automatic ingestion service:', error);
    process.exit(1);
  }
}

start();
