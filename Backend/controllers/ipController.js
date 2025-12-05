const IP = require('../models/IP');
const Attack = require('../models/Attack');
const AuditLog = require('../models/AuditLog');

// Get all IPs with filtering
exports.getAllIPs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      country,
      is_blacklisted,
      min_threat_score,
      search
    } = req.query;

    const query = {};

    if (country) query.country = country;
    if (is_blacklisted !== undefined) query.is_blacklisted = is_blacklisted === 'true';
    if (min_threat_score) query.threat_score = { $gte: parseInt(min_threat_score) };
    if (search) {
      query.$or = [
        { ip_address: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { isp: { $regex: search, $options: 'i' } }
      ];
    }

    const ips = await IP.find(query)
      .sort({ threat_score: -1, last_activity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await IP.countDocuments(query);

    res.json({
      ips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get IP by ID
exports.getIPById = async (req, res) => {
  try {
    const ip = await IP.findById(req.params.id)
      .populate('attacks', 'type date severity target_country');

    if (!ip) {
      return res.status(404).json({ message: 'IP not found' });
    }

    res.json(ip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get IP by address
exports.getIPByAddress = async (req, res) => {
  try {
    const ip = await IP.findOne({ ip_address: req.params.address })
      .populate('attacks', 'type date severity target_country');

    if (!ip) {
      return res.status(404).json({ message: 'IP not found' });
    }

    res.json(ip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update IP
exports.createOrUpdateIP = async (req, res) => {
  try {
    const { ip_address } = req.body;
    
    let ip = await IP.findOne({ ip_address });
    
    if (ip) {
      // Update existing IP
      Object.assign(ip, req.body);
      ip.updated_at = new Date();
      await ip.save();
      
      if (req.user) {
        await AuditLog.create({
          action: 'UPDATE',
          resource_type: 'IP',
          resource_id: ip._id,
          user_id: req.user._id,
          username: req.user.username,
          ip_address: req.ip,
          description: `Updated IP ${ip_address}`
        });
      }
    } else {
      // Create new IP
      ip = new IP(req.body);
      await ip.save();
      
      if (req.user) {
        await AuditLog.create({
          action: 'CREATE',
          resource_type: 'IP',
          resource_id: ip._id,
          user_id: req.user._id,
          username: req.user.username,
          ip_address: req.ip,
          description: `Created new IP ${ip_address}`
        });
      }
    }

    res.json(ip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update IP
exports.updateIP = async (req, res) => {
  try {
    const ip = await IP.findById(req.params.id);
    
    if (!ip) {
      return res.status(404).json({ message: 'IP not found' });
    }

    const oldData = ip.toObject();
    Object.assign(ip, req.body);
    ip.updated_at = new Date();
    
    await ip.save();

    if (req.user) {
      const fieldsChanged = Object.keys(req.body).filter(key => 
        JSON.stringify(oldData[key]) !== JSON.stringify(ip[key])
      );

      await AuditLog.create({
        action: 'UPDATE',
        resource_type: 'IP',
        resource_id: ip._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Updated IP ${ip.ip_address}`,
        changes: {
          before: oldData,
          after: ip.toObject(),
          fields_changed: fieldsChanged
        }
      });
    }

    res.json(ip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete IP
exports.deleteIP = async (req, res) => {
  try {
    const ip = await IP.findById(req.params.id);
    
    if (!ip) {
      return res.status(404).json({ message: 'IP not found' });
    }

    if (req.user) {
      await AuditLog.create({
        action: 'DELETE',
        resource_type: 'IP',
        resource_id: ip._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Deleted IP ${ip.ip_address}`
      });
    }

    await IP.findByIdAndDelete(req.params.id);
    res.json({ message: 'IP deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top dangerous IPs
exports.getTopDangerousIPs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const ips = await IP.aggregate([
      {
        $match: {
          is_active: true,
          threat_score: { $gte: 70 }
        }
      },
      {
        $lookup: {
          from: 'attacks',
          let: { ip_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$source_ip_ref', '$$ip_id'] }
              }
            },
            {
              $project: {
                type: 1,
                severity: 1,
                date: 1,
                target_country: 1
              }
            },
            { $sort: { date: -1 } },
            { $limit: 10 }
          ],
          as: 'recent_attacks'
        }
      },
      {
        $addFields: {
          attack_diversity: { $size: { $setUnion: '$attack_types' } },
          malware_diversity: { $size: '$malware_families' },
          days_active: {
            $divide: [
              { $subtract: ['$last_activity', '$first_seen'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $sort: {
          threat_score: -1,
          attack_count: -1
        }
      },
      { $limit: limit }
    ]);

    res.json(ips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enrich IP with external APIs (placeholder - implement actual API calls)
exports.enrichIP = async (req, res) => {
  try {
    const ip = await IP.findById(req.params.id);
    
    if (!ip) {
      return res.status(404).json({ message: 'IP not found' });
    }

    // TODO: Implement actual API calls to VirusTotal, AbuseIPDB, Shodan
    // This is a placeholder structure
    
    ip.last_enrichment = new Date();
    ip.enrichment_sources = ['VirusTotal', 'AbuseIPDB', 'Shodan'];
    
    await ip.save();

    res.json({ message: 'IP enrichment initiated', ip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

