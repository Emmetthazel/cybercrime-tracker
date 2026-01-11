const Attack = require('../models/Attack');
const IP = require('../models/IP');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const graphSyncService = require('../services/graphSyncService');

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
      source,
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
    if (source) query.source = source;
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
        // Calculate initial threat score based on attack severity
        let initialThreatScore = 0;
        if (attackData.severity === 'Critical') initialThreatScore = 80;
        else if (attackData.severity === 'High') initialThreatScore = 60;
        else if (attackData.severity === 'Medium') initialThreatScore = 40;
        else if (attackData.severity === 'Low') initialThreatScore = 20;

        // Create IP if it doesn't exist
        ipDoc = await IP.create({
          ip_address: attackData.source_ip,
          country: attackData.source_country,
          first_seen: new Date(),
          last_activity: new Date(),
          attack_count: 1,
          threat_score: initialThreatScore,
          attack_types: attackData.type ? [attackData.type] : []
        });
      } else {
        // Update IP stats
        ipDoc.attack_count += 1;
        ipDoc.last_activity = new Date();
        if (attackData.type && !ipDoc.attack_types.includes(attackData.type)) {
          ipDoc.attack_types.push(attackData.type);
        }
        
        // Recalculate threat score based on attack count and severity
        // Base score increases with attack count (capped at 50 points)
        const countScore = Math.min(ipDoc.attack_count * 10, 50);
        
        // Severity multiplier (adds 0-30 points based on current attack)
        let severityBonus = 0;
        if (attackData.severity === 'Critical') severityBonus = 30;
        else if (attackData.severity === 'High') severityBonus = 20;
        else if (attackData.severity === 'Medium') severityBonus = 10;
        else if (attackData.severity === 'Low') severityBonus = 5;
        
        // Calculate new threat score (weighted average to smooth changes)
        const newThreatScore = Math.min(100, Math.max(
          ipDoc.threat_score || 0,
          countScore + severityBonus
        ));
        ipDoc.threat_score = newThreatScore;
        
        // Auto-blacklist if threat score >= 80 or attack count >= 5
        if ((newThreatScore >= 80 || ipDoc.attack_count >= 5) && !ipDoc.is_blacklisted) {
          ipDoc.is_blacklisted = true;
          ipDoc.blacklisted_at = new Date();
          if (!ipDoc.blacklist_reason) {
            ipDoc.blacklist_reason = `Auto-blacklisted due to ${ipDoc.attack_count} attack(s) with threat score ${newThreatScore}`;
          }
        }
        
        await ipDoc.save();
      }
      
      attackData.source_ip_ref = ipDoc._id;
    }

    if (!attackData.reported_by && req.user) {
      attackData.reported_by = req.user._id;
    }

    // Ensure date is set to current date/time if not provided or if provided date is invalid
    if (!attackData.date || isNaN(new Date(attackData.date).getTime())) {
      attackData.date = new Date();
    } else {
      // Ensure date is a proper Date object
      attackData.date = new Date(attackData.date);
    }

    // Debug logging
    console.log(`[createAttack] Creating attack with date: ${attackData.date.toISOString()}`);
    console.log(`[createAttack] Reported by: ${attackData.reported_by}`);

    const attack = new Attack(attackData);
    await attack.save();

    // Populate before returning
    await attack.populate('reported_by', 'username full_name');
    await attack.populate('source_ip_ref', 'ip_address country threat_score');

    // Sync to Neo4j for graph visualization
    try {
      // Sync IP to Neo4j if it exists (source_ip_ref is populated, so it's the IP document)
      if (attack.source_ip_ref) {
        await graphSyncService.syncIP(attack.source_ip_ref);
      }
      
      // Sync user to Neo4j if it exists (reported_by is populated, so it's the User document with _id)
      if (attack.reported_by) {
        // reported_by is populated, get the user ID and fetch full document
        const userId = attack.reported_by._id || attack.reported_by;
        const userDoc = await User.findById(userId);
        if (userDoc) {
          await graphSyncService.syncUser(userDoc);
        }
      }
      
      // Sync attack to Neo4j
      await graphSyncService.syncAttack(attack);
    } catch (syncError) {
      // Log sync error but don't fail the request
      console.error('Error syncing attack to Neo4j:', syncError.message);
    }

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

    // Populate relationships for sync
    await attack.populate('source_ip_ref');
    await attack.populate('reported_by');

    // Sync to Neo4j for graph visualization
    try {
      // Sync IP to Neo4j if it exists (source_ip_ref is populated, so it's the IP document)
      if (attack.source_ip_ref) {
        await graphSyncService.syncIP(attack.source_ip_ref);
      }
      
      // Sync user to Neo4j if it exists (reported_by is populated, so it's the User document with _id)
      if (attack.reported_by) {
        // reported_by is populated, get the user ID and fetch full document
        const userId = attack.reported_by._id || attack.reported_by;
        const userDoc = await User.findById(userId);
        if (userDoc) {
          await graphSyncService.syncUser(userDoc);
        }
      }
      
      // Sync attack to Neo4j
      await graphSyncService.syncAttack(attack);
    } catch (syncError) {
      // Log sync error but don't fail the request
      console.error('Error syncing attack to Neo4j:', syncError.message);
    }

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

    const attackId = attack._id.toString();

    // Remove from Neo4j before deleting from MongoDB
    try {
      await graphSyncService.removeAttack(attackId);
    } catch (syncError) {
      // Log sync error but don't fail the request
      console.error('Error removing attack from Neo4j:', syncError.message);
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

