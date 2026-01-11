const IP = require('../models/IP');
const Attack = require('../models/Attack');
const AuditLog = require('../models/AuditLog');
const externalAPIService = require('../services/externalAPIService');
const dataSyncService = require('../services/dataSyncService');

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

// Enrich IP with external APIs
exports.enrichIP = async (req, res) => {
  try {
    const ip = await IP.findById(req.params.id);
    
    if (!ip) {
      return res.status(404).json({ message: 'IP not found' });
    }

    // Enrichir avec toutes les APIs disponibles
    const enrichmentData = await externalAPIService.enrichIPData(ip.ip_address);
    
    // Mettre à jour l'IP avec les données enrichies
    if (enrichmentData.sources.virustotal) {
      ip.virustotal_data = {
        malicious: enrichmentData.sources.virustotal.data.malicious_count || 0,
        suspicious: enrichmentData.sources.virustotal.data.suspicious_count || 0,
        harmless: enrichmentData.sources.virustotal.data.harmless_count || 0,
        reputation: enrichmentData.sources.virustotal.data.reputation || 0,
        last_analysis_date: enrichmentData.sources.virustotal.data.last_analysis_date
      };
    }

    if (enrichmentData.sources.abuseipdb) {
      ip.abuseipdb_data = enrichmentData.sources.abuseipdb.data;
      ip.threat_score = Math.max(ip.threat_score || 0, enrichmentData.sources.abuseipdb.data.abuse_confidence_score || 0);
      ip.reported_count = enrichmentData.sources.abuseipdb.data.total_reports || 0;
    }

    if (enrichmentData.sources.shodan) {
      ip.shodan_data = {
        last_scan: enrichmentData.sources.shodan.data.last_update,
        hostnames: enrichmentData.sources.shodan.data.hostnames || [],
        tags: [],
        vulns: enrichmentData.sources.shodan.data.vulns || []
      };
      ip.open_ports = enrichmentData.sources.shodan.data.ports || [];
      ip.services = enrichmentData.sources.shodan.data.services || [];
    }

    ip.last_enrichment = new Date();
    ip.enrichment_sources = Object.keys(enrichmentData.sources);
    
    await ip.save();

    if (req.user) {
      await AuditLog.create({
        action: 'ENRICH',
        resource_type: 'IP',
        resource_id: ip._id,
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Enriched IP ${ip.ip_address} with external APIs`
      });
    }

    res.json({ message: 'IP enriched successfully', ip, enrichment: enrichmentData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check IP manually with Threat Intelligence APIs and create incidents (Option A from ChatGPT)
exports.checkIP = async (req, res) => {
  try {
    const { ip_address, source } = req.body; // source: 'shodan', 'abuseipdb', 'virustotal', 'all'
    
    if (!ip_address) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    const results = {
      ip: ip_address,
      checks: {},
      incidents_created: 0,
      incidents: []
    };

    // Option 1: Check with specific source
    if (source && source !== 'all') {
      let apiData;
      let sourceName;

      switch (source.toLowerCase()) {
        case 'shodan':
          apiData = await externalAPIService.fetchFromShodan(ip_address);
          sourceName = 'Shodan';
          break;
        case 'abuseipdb':
          apiData = await externalAPIService.fetchFromAbuseIPDB(ip_address);
          sourceName = 'AbuseIPDB';
          break;
        case 'virustotal':
          apiData = await externalAPIService.fetchFromVirusTotal(ip_address, 'ip');
          sourceName = 'VirusTotal';
          break;
        case 'otx':
          apiData = await externalAPIService.fetchFromOTX(ip_address, 'IPv4');
          sourceName = 'OTX';
          break;
        default:
          return res.status(400).json({ message: `Unknown source: ${source}` });
      }

      results.checks[sourceName] = apiData.data;

      // Créer un objet source temporaire pour la transformation
      const tempSource = { name: sourceName, type: 'API', data_mapping: {} };
      
      // Transformer les données en incidents avec règles intelligentes
      const feedData = { data: apiData.data, source: sourceName, timestamp: new Date() };
      const transformedData = dataSyncService.transformData(feedData, tempSource);

      // Créer les incidents (utiliser la méthode du service qui gère la déduplication)
      const syncResult = await dataSyncService.createIncidentsFromData(
        transformedData,
        tempSource
      );

      results.incidents_created = syncResult.created;
      // Récupérer les incidents créés depuis la base (créés dans les 30 dernières secondes)
      if (syncResult.created > 0) {
        const recentTime = new Date(Date.now() - 30000); // 30 secondes
        const createdAttacks = await Attack.find({ 
          source_ip: ip_address,
          source: 'API Sync',
          created_at: { $gte: recentTime }
        })
        .sort({ created_at: -1 })
        .limit(syncResult.created);
        results.incidents = createdAttacks;
      }
    } 
    // Option 2: Check with all sources
    else {
      const sources = ['shodan', 'abuseipdb', 'virustotal', 'otx'];
      
      for (const src of sources) {
        try {
          let apiData;
          let sourceName;

          switch (src) {
            case 'shodan':
              apiData = await externalAPIService.fetchFromShodan(ip_address);
              sourceName = 'Shodan';
              break;
            case 'abuseipdb':
              apiData = await externalAPIService.fetchFromAbuseIPDB(ip_address);
              sourceName = 'AbuseIPDB';
              break;
            case 'virustotal':
              apiData = await externalAPIService.fetchFromVirusTotal(ip_address, 'ip');
              sourceName = 'VirusTotal';
              break;
            case 'otx':
              apiData = await externalAPIService.fetchFromOTX(ip_address, 'IPv4');
              sourceName = 'OTX';
              break;
          }

          results.checks[sourceName] = apiData.data;

          // Créer un objet source temporaire pour la transformation
          const tempSource = { name: sourceName, type: 'API', data_mapping: {} };
          
          // Transformer et créer incidents
          const feedData = { data: apiData.data, source: sourceName, timestamp: new Date() };
          const transformedData = dataSyncService.transformData(feedData, tempSource);

          const syncResult = await dataSyncService.createIncidentsFromData(
            transformedData,
            tempSource
          );

          results.incidents_created += syncResult.created;
          if (syncResult.created > 0) {
            // Récupérer les incidents créés récemment (dans les 30 dernières secondes)
            const recentTime = new Date(Date.now() - 30000); // 30 secondes
            const createdAttacks = await Attack.find({ 
              source_ip: ip_address,
              source: 'API Sync',
              created_at: { $gte: recentTime }
            })
            .sort({ created_at: -1 })
            .limit(syncResult.created);
            results.incidents.push(...createdAttacks);
          }

          // Attendre un peu entre les APIs pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          // Utiliser sourceName si défini, sinon src
          const errorSourceName = sourceName || src.charAt(0).toUpperCase() + src.slice(1);
          results.checks[errorSourceName] = { error: error.message };
          console.error(`Error checking IP with ${errorSourceName}:`, error);
        }
      }
    }

    // Enrichir l'IP avec toutes les données
    const ip = await dataSyncService.ensureIP(ip_address, { name: 'Manual Check' });
    await externalAPIService.enrichIPData(ip_address);

    if (req.user) {
      await AuditLog.create({
        action: 'CHECK_IP',
        resource_type: 'IP',
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Manual IP check for ${ip_address} via ${source || 'all sources'}. Created ${results.incidents_created} incidents.`
      });
    }

    res.json({
      message: `IP check completed. ${results.incidents_created} incident(s) created.`,
      ...results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

