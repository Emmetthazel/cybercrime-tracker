const Source = require('../models/Source');
const AuditLog = require('../models/AuditLog');

// Get all sources
exports.getAllSources = async (req, res) => {
  try {
    const sources = await Source.find()
      .sort({ name: 1 });

    res.json(sources);
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

// Sync source (placeholder for actual sync logic)
exports.syncSource = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    if (!source.sync_enabled) {
      return res.status(400).json({ message: 'Source sync is disabled' });
    }

    // Update sync status
    source.sync_status = 'In Progress';
    source.last_sync = new Date();
    await source.save();

    // TODO: Implement actual sync logic here
    // This would call external APIs and update the database

    // Simulate sync completion
    setTimeout(async () => {
      source.sync_status = 'Success';
      source.total_syncs += 1;
      source.successful_syncs += 1;
      source.next_sync = new Date(Date.now() + source.sync_interval * 1000);
      await source.save();
    }, 1000);

    res.json({ message: 'Source sync initiated', source });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

