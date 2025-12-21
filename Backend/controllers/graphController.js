const neo4jService = require('../services/neo4jService');
const graphSyncService = require('../services/graphSyncService');
const Attack = require('../models/Attack');
const IP = require('../models/IP');

/**
 * Graph Controller
 * Handles graph-based queries using Neo4j
 */

/**
 * Get related attacks for a specific attack (campaign detection)
 * GET /api/graph/attacks/:id/related
 */
exports.getRelatedAttacks = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxDepth = 3 } = req.query;

    const relatedAttacks = await neo4jService.findRelatedAttacks(id, parseInt(maxDepth));
    
    // Enrich with full attack details from MongoDB
    const attackIds = relatedAttacks.map(rel => rel.attack.id);
    const attacks = await Attack.find({ _id: { $in: attackIds } })
      .populate('reported_by', 'username')
      .populate('source_ip_ref', 'ip_address country')
      .lean();

    // Merge Neo4j relationship data with MongoDB attack data
    const enriched = relatedAttacks.map(rel => {
      const attack = attacks.find(a => a._id.toString() === rel.attack.id);
      return {
        ...attack,
        relationship_depth: rel.depth,
      };
    });

    res.json({
      success: true,
      attack_id: id,
      max_depth: parseInt(maxDepth),
      related_attacks: enriched,
      count: enriched.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching related attacks',
      error: error.message,
    });
  }
};

/**
 * Get attack chain for a specific IP
 * GET /api/graph/ips/:id/attack-chain
 */
exports.getIPAttackChain = async (req, res) => {
  try {
    const { id } = req.params;

    const attackChain = await neo4jService.findAttackChain(id);
    
    // Enrich with full details from MongoDB
    const attackIds = attackChain.map(chain => chain.attack.id);
    const attacks = await Attack.find({ _id: { $in: attackIds } })
      .populate('reported_by', 'username')
      .populate('source_ip_ref', 'ip_address country')
      .lean();

    const enriched = attackChain.map(chain => {
      const attack = attacks.find(a => a._id.toString() === chain.attack.id);
      return {
        ...attack,
        vulnerabilities: chain.vulnerabilities,
        indicators: chain.indicators,
        related_attacks: chain.related_attacks,
      };
    });

    res.json({
      success: true,
      ip_id: id,
      attack_chain: enriched,
      count: enriched.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attack chain',
      error: error.message,
    });
  }
};

/**
 * Get associated IPs (same ASN, organization, etc.)
 * GET /api/graph/ips/:id/associated
 */
exports.getAssociatedIPs = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxDepth = 2 } = req.query;

    const associatedIPs = await neo4jService.findAssociatedIPs(id, parseInt(maxDepth));
    
    // Enrich with full IP details from MongoDB
    const ipIds = associatedIPs.map(assoc => assoc.ip.id);
    const ips = await IP.find({ _id: { $in: ipIds } }).lean();

    const enriched = associatedIPs.map(assoc => {
      const ip = ips.find(i => i._id.toString() === assoc.ip.id);
      return {
        ...ip,
        relationship_depth: assoc.depth,
      };
    });

    res.json({
      success: true,
      ip_id: id,
      max_depth: parseInt(maxDepth),
      associated_ips: enriched,
      count: enriched.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching associated IPs',
      error: error.message,
    });
  }
};

/**
 * Detect campaigns (clusters of related attacks)
 * GET /api/graph/campaigns/detect
 */
exports.detectCampaigns = async (req, res) => {
  try {
    const { minAttacks = 3, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const campaigns = await neo4jService.detectCampaigns(parseInt(minAttacks), startDate);

    res.json({
      success: true,
      min_attacks: parseInt(minAttacks),
      days: parseInt(days),
      campaigns: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error detecting campaigns',
      error: error.message,
    });
  }
};

/**
 * Get threat intelligence network
 * GET /api/graph/threat-intelligence/:id/network
 */
exports.getThreatIntelligenceNetwork = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxDepth = 3 } = req.query;

    const network = await neo4jService.findThreatIntelligenceNetwork(id, parseInt(maxDepth));

    res.json({
      success: true,
      indicator_id: id,
      max_depth: parseInt(maxDepth),
      network: network,
      count: network.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching threat intelligence network',
      error: error.message,
    });
  }
};

/**
 * Get graph statistics
 * GET /api/graph/statistics
 */
exports.getGraphStatistics = async (req, res) => {
  try {
    const stats = await neo4jService.getGraphStatistics();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching graph statistics',
      error: error.message,
    });
  }
};

/**
 * Get graph visualization data
 * GET /api/graph/visualization
 */
exports.getGraphVisualization = async (req, res) => {
  try {
    const { maxNodes = 100, maxDepth = 2 } = req.query;
    
    const graphData = await neo4jService.getGraphVisualization(
      parseInt(maxNodes),
      parseInt(maxDepth)
    );

    res.json({
      success: true,
      nodes: graphData.nodes,
      links: graphData.links,
      nodeCount: graphData.nodes.length,
      linkCount: graphData.links.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching graph visualization data',
      error: error.message,
    });
  }
};

/**
 * Sync a specific attack to Neo4j
 * POST /api/graph/sync/attack/:id
 */
exports.syncAttack = async (req, res) => {
  try {
    const { id } = req.params;
    const attack = await Attack.findById(id)
      .populate('source_ip_ref')
      .populate('reported_by')
      .populate('assigned_to');

    if (!attack) {
      return res.status(404).json({
        success: false,
        message: 'Attack not found',
      });
    }

    const synced = await graphSyncService.syncAttack(attack);

    if (synced) {
      res.json({
        success: true,
        message: 'Attack synced to Neo4j successfully',
        attack_id: id,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to sync attack to Neo4j',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing attack',
      error: error.message,
    });
  }
};

/**
 * Sync a specific IP to Neo4j
 * POST /api/graph/sync/ip/:id
 */
exports.syncIP = async (req, res) => {
  try {
    const { id } = req.params;
    const ip = await IP.findById(id);

    if (!ip) {
      return res.status(404).json({
        success: false,
        message: 'IP not found',
      });
    }

    const synced = await graphSyncService.syncIP(ip);

    if (synced) {
      res.json({
        success: true,
        message: 'IP synced to Neo4j successfully',
        ip_id: id,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to sync IP to Neo4j',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing IP',
      error: error.message,
    });
  }
};

