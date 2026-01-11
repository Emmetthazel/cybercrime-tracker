const dataSyncService = require('./dataSyncService');
const Source = require('../models/Source');
const Attack = require('../models/Attack');
const AuditLog = require('../models/AuditLog');

/**
 * Service principal pour l'ingestion automatique d'incidents depuis les APIs de Threat Intelligence
 * Orchestre la synchronisation et la création d'incidents
 */

class ThreatIntelIngestionService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
  }

  /**
   * Démarre le service d'ingestion automatique
   * @param {number} intervalMinutes - Intervalle de synchronisation en minutes (défaut: 60)
   */
  async startAutomaticIngestion(intervalMinutes = 60) {
    if (this.isRunning) {
      console.log('Automatic ingestion is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`Starting automatic threat intelligence ingestion (interval: ${intervalMinutes} minutes)`);

    // Exécuter immédiatement une première synchronisation
    await this.runIngestionCycle();

    // Puis exécuter périodiquement
    this.syncInterval = setInterval(async () => {
      await this.runIngestionCycle();
    }, intervalMs);
  }

  /**
   * Arrête le service d'ingestion automatique
   */
  stopAutomaticIngestion() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Automatic threat intelligence ingestion stopped');
  }

  /**
   * Exécute un cycle d'ingestion
   */
  async runIngestionCycle() {
    try {
      console.log(`[${new Date().toISOString()}] Starting ingestion cycle...`);
      
      const result = await dataSyncService.syncAllSources();
      
      console.log(`[${new Date().toISOString()}] Ingestion cycle completed:`, {
        total: result.total,
        successful: result.results.filter(r => r.success).length,
        failed: result.results.filter(r => !r.success).length,
        totalCreated: result.results.reduce((sum, r) => sum + (r.created || 0), 0)
      });

      // Logger dans AuditLog
      await AuditLog.create({
        action: 'SYNC',
        resource_type: 'Source',
        description: `Automatic ingestion cycle: ${result.total} sources processed`,
        metadata: {
          total: result.total,
          results: result.results
        }
      });

      return result;
    } catch (error) {
      console.error('Error in ingestion cycle:', error);
      
      await AuditLog.create({
        action: 'SYNC_ERROR',
        resource_type: 'Source',
        description: `Automatic ingestion cycle failed: ${error.message}`,
        metadata: { error: error.message }
      });

      throw error;
    }
  }

  /**
   * Synchronise une source spécifique manuellement
   */
  async syncSource(sourceId) {
    try {
      const result = await dataSyncService.syncSource(sourceId);
      
      if (result.success) {
        await AuditLog.create({
          action: 'SYNC',
          resource_type: 'Source',
          resource_id: sourceId,
          description: `Manual sync: ${result.created} incidents created, ${result.skipped} skipped`,
          metadata: result
        });
      }

      return result;
    } catch (error) {
      console.error(`Error syncing source ${sourceId}:`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle source de Threat Intelligence
   */
  async createThreatIntelSource(sourceData) {
    try {
      const source = new Source({
        ...sourceData,
        type: 'API',
        sync_enabled: true,
        is_active: true,
        sync_interval: sourceData.sync_interval || 3600, // 1 heure par défaut
        next_sync: new Date(Date.now() + (sourceData.sync_interval || 3600) * 1000)
      });

      await source.save();

      // Tester la connexion immédiatement
      try {
        await dataSyncService.syncSource(source._id);
      } catch (error) {
        console.warn(`Initial sync test failed for source ${source.name}:`, error.message);
        source.is_active = false;
        await source.save();
      }

      return source;
    } catch (error) {
      console.error('Error creating threat intelligence source:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques d'ingestion
   */
  async getIngestionStats() {
    try {
      const sources = await Source.find({ type: 'API' });
      
      const totalSyncs = sources.reduce((sum, s) => sum + (s.total_syncs || 0), 0);
      const successfulSyncs = sources.reduce((sum, s) => sum + (s.successful_syncs || 0), 0);
      const failedSyncs = sources.reduce((sum, s) => sum + (s.failed_syncs || 0), 0);
      
      const stats = {
        totalSources: sources.length,
        activeSources: sources.filter(s => s.is_active && s.sync_enabled).length,
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        totalRecordsCollected: sources.reduce((sum, s) => sum + (s.records_collected || 0), 0),
        lastSync: sources
          .filter(s => s.last_sync)
          .sort((a, b) => b.last_sync - a.last_sync)[0]?.last_sync || null
      };

      // Compter les incidents créés automatiquement (plus fiable que records_collected)
      const autoIncidents = await Attack.countDocuments({ source: 'API Sync' });
      stats.totalAutoIncidents = autoIncidents;
      
      // Utiliser le nombre réel d'incidents si records_collected est 0 mais qu'il y a des incidents
      if (stats.totalRecordsCollected === 0 && autoIncidents > 0) {
        stats.totalRecordsCollected = autoIncidents;
      }
      
      // Calculer le taux de succès
      if (totalSyncs > 0) {
        stats.successRate = Math.round((successfulSyncs / totalSyncs) * 100);
      } else {
        stats.successRate = 0;
      }

      return stats;
    } catch (error) {
      console.error('Error getting ingestion stats:', error);
      throw error;
    }
  }

  /**
   * Obtient les sources actives avec leur statut
   */
  async getActiveSources() {
    try {
      const sources = await Source.find({
        type: 'API',
        sync_enabled: true
      }).sort({ name: 1 });

      return sources.map(source => ({
        id: source._id,
        name: source.name,
        is_active: source.is_active,
        sync_status: source.sync_status,
        last_sync: source.last_sync,
        next_sync: source.next_sync,
        records_collected: source.records_collected,
        reliability_score: source.reliability_score,
        consecutive_errors: source.consecutive_errors
      }));
    } catch (error) {
      console.error('Error getting active sources:', error);
      throw error;
    }
  }
}

module.exports = new ThreatIntelIngestionService();
