const Source = require('../models/Source');
const Attack = require('../models/Attack');
const AuditLog = require('../models/AuditLog');
const threatIntelIngestionService = require('../services/threatIntelIngestionService');
const dataSyncService = require('../services/dataSyncService');

// Get all sources
exports.getAllSources = async (req, res) => {
  try {
    const sources = await Source.find()
      .sort({ name: 1 });

    // Enrichir chaque source avec le nombre réel d'incidents créés
    const sourcesWithStats = await Promise.all(
      sources.map(async (source) => {
        const sourceObj = source.toObject();
        // Compter les incidents créés par cette source
        const incidentCount = await Attack.countDocuments({ 
          source_id: source._id,
          source: 'API Sync'
        });
        // Utiliser le nombre réel si records_collected est 0 ou inférieur
        if (incidentCount > 0 && (!sourceObj.records_collected || sourceObj.records_collected < incidentCount)) {
          sourceObj.records_collected = incidentCount;
        }
        return sourceObj;
      })
    );

    res.json(sourcesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get source by ID
exports.getSourceById = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);

    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    res.json(source);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create source
exports.createSource = async (req, res) => {
  try {
    const source = new Source(req.body);
    await source.save();

    if (req.user) {
      await AuditLog.create({
        action: 'CREATE',
        resource_type: 'Source',
        resource_id: source._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Created source: ${source.name}`
      });
    }

    res.status(201).json(source);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update source
exports.updateSource = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    Object.assign(source, req.body);
    source.updated_at = new Date();
    await source.save();

    if (req.user) {
      await AuditLog.create({
        action: 'UPDATE',
        resource_type: 'Source',
        resource_id: source._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Updated source: ${source.name}`
      });
    }

    res.json(source);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete source
exports.deleteSource = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    if (req.user) {
      await AuditLog.create({
        action: 'DELETE',
        resource_type: 'Source',
        resource_id: source._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Deleted source: ${source.name}`
      });
    }

    await Source.findByIdAndDelete(req.params.id);
    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync source - synchronise une source spécifique
exports.syncSource = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    if (!source.sync_enabled) {
      return res.status(400).json({ message: 'Source sync is disabled' });
    }

    if (req.user) {
      await AuditLog.create({
        action: 'SYNC',
        resource_type: 'Source',
        resource_id: source._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Manual sync initiated for source: ${source.name}`
      });
    }

    // Lancer la synchronisation de manière asynchrone
    const syncPromise = threatIntelIngestionService.syncSource(req.params.id);
    
    // Retourner immédiatement pour ne pas bloquer la requête
    res.json({ 
      message: 'Source sync initiated', 
      source: {
        id: source._id,
        name: source.name,
        status: 'In Progress'
      }
    });

    // Attendre la fin de la synchronisation en arrière-plan
    syncPromise.then(result => {
      console.log(`Sync completed for source ${source.name}:`, result);
    }).catch(error => {
      console.error(`Sync failed for source ${source.name}:`, error);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync all sources
exports.syncAllSources = async (req, res) => {
  try {
    if (req.user) {
      await AuditLog.create({
        action: 'SYNC_ALL',
        resource_type: 'Source',
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: 'Manual sync all sources initiated'
      });
    }

    // Lancer la synchronisation de manière asynchrone
    const syncPromise = dataSyncService.syncAllSources();
    
    // Retourner immédiatement pour ne pas bloquer
    res.json({ 
      message: 'Sync all sources initiated',
      status: 'In Progress'
    });

    // Attendre la fin en arrière-plan et logger les résultats
    syncPromise.then(result => {
      console.log('Sync all sources completed:', {
        total: result.total,
        successful: result.results.filter(r => r.success).length,
        failed: result.results.filter(r => !r.success).length
      });
    }).catch(error => {
      console.error('Sync all sources failed:', error.message);
      // L'erreur est déjà loggée, on ne renvoie pas d'erreur HTTP car la requête a déjà répondu
    });
  } catch (error) {
    console.error('Error initiating sync all sources:', error);
    res.status(500).json({ 
      message: 'Failed to initiate sync',
      error: error.message 
    });
  }
};

// Get ingestion statistics
exports.getIngestionStats = async (req, res) => {
  try {
    const stats = await threatIntelIngestionService.getIngestionStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active sources
exports.getActiveSources = async (req, res) => {
  try {
    const sources = await threatIntelIngestionService.getActiveSources();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

