const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');

// Get all alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await Alert.find(query)
      .populate('acknowledged_by', 'username full_name')
      .populate('resolved_by', 'username full_name')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Alert.countDocuments(query);

    res.json({
      alerts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get alert by ID
exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('acknowledged_by', 'username full_name')
      .populate('resolved_by', 'username full_name')
      .populate('source_id');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create alert
exports.createAlert = async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();

    if (req.user) {
      await AuditLog.create({
        action: 'CREATE',
        resource_type: 'Alert',
        resource_id: alert._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Created alert: ${alert.title}`
      });
    }

    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update alert
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    Object.assign(alert, req.body);
    alert.updated_at = new Date();
    await alert.save();

    if (req.user) {
      await AuditLog.create({
        action: 'UPDATE',
        resource_type: 'Alert',
        resource_id: alert._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Updated alert: ${alert.title}`
      });
    }

    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Acknowledge alert
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'Acknowledged';
    alert.acknowledged_by = req.user._id;
    alert.acknowledged_at = new Date();
    await alert.save();

    await AuditLog.create({
      action: 'UPDATE',
      resource_type: 'Alert',
      resource_id: alert._id,
      user_id: req.user._id,
      username: req.user.username,
      ip_address: req.ip,
      description: `Acknowledged alert: ${alert.title}`
    });

    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Resolve alert
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'Resolved';
    alert.resolved_by = req.user._id;
    alert.resolved_at = new Date();
    await alert.save();

    await AuditLog.create({
      action: 'UPDATE',
      resource_type: 'Alert',
      resource_id: alert._id,
      user_id: req.user._id,
      username: req.user.username,
      ip_address: req.ip,
      description: `Resolved alert: ${alert.title}`
    });

    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete alert
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await AuditLog.create({
      action: 'DELETE',
      resource_type: 'Alert',
      resource_id: alert._id,
      user_id: req.user._id,
      username: req.user.username,
      ip_address: req.ip,
      description: `Deleted alert: ${alert.title}`
    });

    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

