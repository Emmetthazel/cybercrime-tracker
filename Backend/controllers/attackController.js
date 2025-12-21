const Attack = require('../models/Attack');
const IP = require('../models/IP');
const AuditLog = require('../models/AuditLog');

// Get all attacks with filtering and pagination
exports.getAllAttacks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      status,
      target_country,
      source_ip,
      start_date,
      end_date,
      search
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (target_country) query.target_country = target_country;
    if (source_ip) query.source_ip = source_ip;
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Note: All authenticated users (admin, analyst, user, viewer) can view ALL attacks
    // The role-based restrictions only apply to create, update, and delete operations
    const attacks = await Attack.find(query)
      .populate('reported_by', 'username full_name _id')
      .populate('assigned_to', 'username full_name')
      .populate('source_ip_ref', 'ip_address country threat_score')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Attack.countDocuments(query);

    // Debug logging (remove in production)
    console.log(`[getAllAttacks] User: ${req.user?.username} (${req.user?.role}), Query:`, JSON.stringify(query), `Total: ${total}, Returning: ${attacks.length} attacks`);

    // Log audit
    if (req.user) {
      await AuditLog.create({
        action: 'READ',
        resource_type: 'Attack',
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: 'Retrieved list of attacks'
      });
    }

    const response = {
      attacks,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    };
    
    // Debug logging
    console.log(`[getAllAttacks Response] Sending ${response.attacks.length} attacks out of ${response.total} total (page ${response.currentPage} of ${response.totalPages})`);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single attack by ID
exports.getAttackById = async (req, res) => {
  try {
    const attack = await Attack.findById(req.params.id)
      .populate('reported_by', 'username full_name email')
      .populate('assigned_to', 'username full_name email')
      .populate('verified_by', 'username full_name')
      .populate('source_ip_ref')
      .populate('related_attacks', 'type date severity target_country');
    
    // Skip populating related_vulnerabilities and related_indicators 
    // to avoid errors if models aren't registered

    if (!attack) {
      return res.status(404).json({ message: 'Attack not found' });
    }

    // Log audit
    if (req.user) {
      await AuditLog.create({
        action: 'READ',
        resource_type: 'Attack',
        resource_id: attack._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Viewed attack ${attack._id}`
      });
    }

    res.json(attack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new attack
exports.createAttack = async (req, res) => {
  try {
    const attackData = req.body;
    
    // If source_ip is provided, try to link to IP collection
    if (attackData.source_ip) {
      let ipDoc = await IP.findOne({ ip_address: attackData.source_ip });
      
      if (!ipDoc) {
        // Create IP if it doesn't exist
        ipDoc = await IP.create({
          ip_address: attackData.source_ip,
          country: attackData.source_country,
          first_seen: new Date(),
          last_activity: new Date()
        });
      } else {
        // Update IP stats
        ipDoc.attack_count += 1;
        ipDoc.last_activity = new Date();
        if (attackData.type && !ipDoc.attack_types.includes(attackData.type)) {
          ipDoc.attack_types.push(attackData.type);
        }
        await ipDoc.save();
      }
      
      attackData.source_ip_ref = ipDoc._id;
    }

    if (!attackData.reported_by && req.user) {
      attackData.reported_by = req.user._id;
    }

    const attack = new Attack(attackData);
    await attack.save();

    // Populate before returning
    await attack.populate('reported_by', 'username full_name');
    await attack.populate('source_ip_ref', 'ip_address country threat_score');

    // Log audit
    if (req.user) {
      await AuditLog.create({
        action: 'CREATE',
        resource_type: 'Attack',
        resource_id: attack._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Created new attack: ${attack.type}`,
        details: { type: attack.type, severity: attack.severity }
      });
    }

    res.status(201).json(attack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update attack
exports.updateAttack = async (req, res) => {
  try {
    const attack = await Attack.findById(req.params.id);
    
    if (!attack) {
      return res.status(404).json({ message: 'Attack not found' });
    }

    // Check if user role requires ownership (users can only edit their own attacks)
    if (req.user.role === 'user') {
      const attackOwnerId = attack.reported_by?.toString();
      const userId = req.user._id.toString();
      
      if (attackOwnerId !== userId) {
        return res.status(403).json({ 
          message: 'Access denied. You can only edit attacks that you reported.' 
        });
      }
    }

    const oldData = attack.toObject();
    Object.assign(attack, req.body);
    attack.updated_at = new Date();
    
    await attack.save();

    // Log audit
    if (req.user) {
      const fieldsChanged = Object.keys(req.body).filter(key => 
        JSON.stringify(oldData[key]) !== JSON.stringify(attack[key])
      );

      await AuditLog.create({
        action: 'UPDATE',
        resource_type: 'Attack',
        resource_id: attack._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Updated attack ${attack._id}`,
        changes: {
          before: oldData,
          after: attack.toObject(),
          fields_changed: fieldsChanged
        }
      });
    }

    res.json(attack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete attack
exports.deleteAttack = async (req, res) => {
  try {
    const attack = await Attack.findById(req.params.id);
    
    if (!attack) {
      return res.status(404).json({ message: 'Attack not found' });
    }

    // Log audit before deletion
    if (req.user) {
      await AuditLog.create({
        action: 'DELETE',
        resource_type: 'Attack',
        resource_id: attack._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Deleted attack ${attack._id}`,
        details: { type: attack.type, severity: attack.severity }
      });
    }

    await Attack.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attack deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attack statistics
exports.getAttackStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const dateFilter = {};
    
    if (start_date || end_date) {
      dateFilter.date = {};
      if (start_date) dateFilter.date.$gte = new Date(start_date);
      if (end_date) dateFilter.date.$lte = new Date(end_date);
    }

    const stats = await Attack.aggregate([
      { $match: dateFilter },
      {
        $facet: {
          attack_types: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                avg_severity: { $avg: '$severity_score' }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          targeted_countries: [
            {
              $group: {
                _id: '$target_country',
                count: { $sum: 1 },
                total_impact: { $sum: '$financial_impact' }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          severity_distribution: [
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ],
          status_distribution: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          global_stats: [
            {
              $group: {
                _id: null,
                total_attacks: { $sum: 1 },
                avg_severity: { $avg: '$severity_score' },
                total_financial_impact: { $sum: '$financial_impact' },
                total_affected_users: { $sum: '$affected_users' }
              }
            }
          ],
          time_series: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$date' }
                },
                count: { $sum: 1 },
                critical: {
                  $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] }
                }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

